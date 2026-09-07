const axios = require("axios");

/*
 * Piston execution API.
 *
 * Configurable because the public instance at emkc.org is not guaranteed to be
 * available — it was taken offline on 31 Aug 2026 after an abuse incident and
 * now answers 401 to every request, including /runtimes. Point PISTON_URL at a
 * self-hosted Piston (docker run ghcr.io/engineer-man/piston) to restore
 * execution without touching this code.
 */
const EXECUTE_PATH = "/api/v2/execute";

/**
 * PISTON_URL is documented as a base URL (http://localhost:2000), but the
 * endpoint we actually POST to is /api/v2/execute. Accept either form so a
 * teammate cannot misconfigure it: a bare origin gets the path appended, a URL
 * that already points at an execute endpoint is left alone.
 */
function resolveExecuteUrl(rawUrl) {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");

  return trimmed.endsWith("/execute") ? trimmed : trimmed + EXECUTE_PATH;
}

const PISTON_URL = resolveExecuteUrl(
  process.env.PISTON_URL || "https://emkc.org/api/v2/piston/execute"
);

const BYTES_PER_MB = 1024 * 1024;

/** Env override that only wins if it parses to a positive number. */
function positiveIntEnv(name, fallback) {
  const parsed = Number(process.env[name]);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/*
 * Per-request sandbox limits. Piston enforces these inside isolate, so a
 * runaway program is killed by the runner rather than being allowed to occupy
 * a worker until our own HTTP timeout fires.
 *
 * These are *requests*: Piston refuses any value above the ceiling the
 * container was started with (PISTON_RUN_TIMEOUT and friends), so the effective
 * limit is whichever is lower. See docs/PISTON_SETUP.md §2.
 */
const RUN_TIMEOUT_MS = positiveIntEnv("EXEC_RUN_TIMEOUT_MS", 5000);
const COMPILE_TIMEOUT_MS = positiveIntEnv("EXEC_COMPILE_TIMEOUT_MS", 10000);
const MEMORY_LIMIT_MB = positiveIntEnv("EXEC_MEMORY_LIMIT_MB", 256);
const MEMORY_LIMIT_BYTES = MEMORY_LIMIT_MB * BYTES_PER_MB;

/*
 * Our HTTP timeout has to outlast the sandbox limits, otherwise axios aborts a
 * job that Piston was about to kill cleanly and we report "the runner did not
 * respond" instead of the real "timed out" outcome. Worst case is a full
 * compile plus a full run, so floor it there with headroom for transfer.
 */
const REQUEST_TIMEOUT_FLOOR_MS = COMPILE_TIMEOUT_MS + RUN_TIMEOUT_MS + 5000;

const REQUEST_TIMEOUT_MS = Math.max(
  positiveIntEnv("PISTON_TIMEOUT_MS", 15000),
  REQUEST_TIMEOUT_FLOOR_MS
);

/*
 * Piston resolves `version` as a semver range, so "*" means "whatever is
 * installed". Exact pins would have to be kept in lockstep with the packages
 * each self-hosted runner happens to have — a mismatch answers `runtime is
 * unknown` — and buy us nothing, since we do not depend on version-specific
 * behaviour in any of these languages.
 */
const LANGUAGE_MAP = {
  javascript: {
    language: "javascript",
    version: "*",
    filename: "main.js",
  },

  python: {
    language: "python",
    version: "*",
    filename: "main.py",
  },

  java: {
    language: "java",
    version: "*",
    filename: "Main.java",
  },

  c: {
    language: "c",
    version: "*",
    filename: "main.c",
  },

  cpp: {
    language: "c++",
    version: "*",
    filename: "main.cpp",
  },
};

/**
 * Failure that already carries the HTTP status the API should answer with, so
 * the controller never has to guess (and never leaks an axios message).
 */
class ExecutionError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "ExecutionError";
    this.status = status;
    this.details = details;
  }
}

/** Upstream said no — translate it into something a user can act on. */
function translateUpstreamError(error) {
  // No response at all: DNS failure, refused connection, or our own timeout.
  if (!error.response) {
    const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

    return new ExecutionError(
      timedOut
        ? `The code runner did not respond within ${REQUEST_TIMEOUT_MS / 1000}s.`
        : "The code execution service is unreachable. Check PISTON_URL or your network.",
      503,
      { code: error.code || null }
    );
  }

  const { status, data } = error.response;
  // Piston puts its explanation in `message`; keep it, it is the useful part.
  const upstreamMessage =
    (typeof data === "string" ? data : data?.message) || null;

  if (status === 401 || status === 403) {
    return new ExecutionError(
      "The code execution service rejected the request. The public Piston API is currently offline — set PISTON_URL to a self-hosted instance.",
      503,
      { upstreamStatus: status, upstreamMessage }
    );
  }

  if (status === 429) {
    return new ExecutionError(
      "The code execution service is rate limiting us. Wait a moment and run it again.",
      429,
      { upstreamStatus: status, upstreamMessage }
    );
  }

  if (status >= 500) {
    return new ExecutionError(
      "The code execution service failed while running this code.",
      502,
      { upstreamStatus: status, upstreamMessage }
    );
  }

  /*
   * Piston caps each per-request limit at the ceiling its container was started
   * with, and rejects the whole request if we ask for more — so a runner
   * launched without our PISTON_RUN_TIMEOUT setting fails *every* execution,
   * not just long ones. Name the fix rather than passing the raw message on.
   */
  if (/cannot exceed the configured limit/i.test(upstreamMessage || "")) {
    return new ExecutionError(
      "The code runner is configured with lower limits than this server asks for. Recreate the Piston container with the env vars in docs/PISTON_SETUP.md §2, or lower EXEC_* in .env to match.",
      502,
      { upstreamStatus: status, upstreamMessage }
    );
  }

  // 4xx: our payload was wrong (bad language/version), not the user's code.
  return new ExecutionError(
    upstreamMessage || "The code execution service rejected this request.",
    502,
    { upstreamStatus: status, upstreamMessage }
  );
}

/** "5s" / "1.5s" — for limit messages, which read badly in milliseconds. */
function formatSeconds(ms) {
  const seconds = ms / 1000;

  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

/*
 * Exit code for a process killed by SIGKILL, as reported by the shell wrapper
 * Piston runs the program under (128 + signal 9).
 */
const SIGKILL_EXIT_CODE = 137;

/**
 * Works out whether a phase was killed for hitting a sandbox limit, and which.
 *
 * The two cases do not look alike in Piston's response, and only one of them is
 * labelled:
 *
 *   timeout — `status: "TO"`, `signal: "SIGKILL"`, `code: null`, and a
 *             `message` of "Time limit exceeded (wall clock)".
 *   memory  — no dedicated status. The kernel OOM-kills the process, the
 *             wrapper exits 137 and `status` is plain "RE" — identical in shape
 *             to any other non-zero exit. What separates it is the exit code
 *             plus `memory` sitting at the ceiling we asked for.
 *
 * Returns null for an ordinary result, including a program that merely exited
 * non-zero on its own.
 */
function classifyLimitHit(phase) {
  if (!phase) return null;

  if (phase.status === "TO" || /time limit/i.test(phase.message || "")) {
    return "timeout";
  }

  // "OL"/"EL": stdout/stderr grew past the runner's output_max_size. Piston
  // kills the process *and discards the buffer*, so without this branch a
  // chatty program shows the user a blank panel and no explanation.
  if (phase.status === "OL" || phase.status === "EL") {
    return "output";
  }

  const killed =
    phase.code === SIGKILL_EXIT_CODE || phase.signal === "SIGKILL";

  if (!killed) return null;

  // Within 10% of the ceiling is the OOM killer, not a coincidence. Anything
  // else that was SIGKILLed we report honestly as "killed" rather than
  // guessing at a cause we cannot see.
  return typeof phase.memory === "number" &&
    phase.memory >= MEMORY_LIMIT_BYTES * 0.9
    ? "memory"
    : "killed";
}

/** The one line the user should see when a limit stopped their program. */
function limitMessage(kind, phaseName) {
  const where = phaseName === "compile" ? "Compilation" : "Execution";

  switch (kind) {
    case "timeout":
      return `${where} timed out (${formatSeconds(
        phaseName === "compile" ? COMPILE_TIMEOUT_MS : RUN_TIMEOUT_MS
      )} limit)`;
    case "memory":
      return `Memory limit exceeded (${MEMORY_LIMIT_MB}MB)`;
    // No byte count here on purpose: output_max_size is a property of the
    // container, not something this request sets, so any number we printed
    // would be a guess that drifts the moment someone retunes the runner.
    case "output":
      return `${where} produced too much output and was stopped.`;
    default:
      return `${where} was stopped by the sandbox.`;
  }
}

/**
 * Executes source code using the Piston execution API.
 *
 * Supported: JavaScript, Python, Java, C, C++
 *
 * A program that compiles-and-fails is a *success* here — the caller gets the
 * stderr and exit code. So is one killed for exceeding a sandbox limit: the
 * caller gets `limitExceeded` and a ready-to-display `limitError`. Only the
 * runner being broken throws.
 */
async function executeCode({ language, code, stdin = "" }) {
  if (!language || !code) {
    throw new ExecutionError("Language and code are required.", 400);
  }

  const selectedLanguage = LANGUAGE_MAP[language];

  if (!selectedLanguage) {
    throw new ExecutionError(`Unsupported language: ${language}`, 400);
  }

  let response;
  try {
    response = await axios.post(
      PISTON_URL,
      {
        language: selectedLanguage.language,
        version: selectedLanguage.version,
        files: [
          {
            name: selectedLanguage.filename,
            content: code,
          },
        ],
        stdin,
        run_timeout: RUN_TIMEOUT_MS,
        compile_timeout: COMPILE_TIMEOUT_MS,
        // CPU time is a *separate* ceiling from wall-clock time, and its own
        // default is lower. Left unset, a busy loop is killed on CPU time well
        // before run_timeout — so our "timed out (5s limit)" message would name
        // a limit that never fired. Keep the two in step.
        run_cpu_time: RUN_TIMEOUT_MS,
        compile_cpu_time: COMPILE_TIMEOUT_MS,
        run_memory_limit: MEMORY_LIMIT_BYTES,
        compile_memory_limit: MEMORY_LIMIT_BYTES,
      },
      { timeout: REQUEST_TIMEOUT_MS }
    );
  } catch (error) {
    throw translateUpstreamError(error);
  }

  const result = response.data;
  // Compile errors live under `compile`, not `run` — surfacing only `run`
  // would show an empty box for every C/C++/Java syntax error.
  const compile = result?.compile;
  const run = result?.run;

  if (!run) {
    throw new ExecutionError(
      "The code execution service returned an unexpected response.",
      502
    );
  }

  // A limit hit during compilation stops the job before it ever runs, so check
  // that phase first and report it as the compile-phase failure it is.
  const compileLimit = classifyLimitHit(compile);
  const runLimit = compileLimit ? null : classifyLimitHit(run);
  const limitExceeded = compileLimit || runLimit;

  const compileFailed = compile && compile.code !== 0;

  return {
    language,
    stdout: run.stdout || "",
    stderr: compileFailed ? compile.stderr || "" : run.stderr || "",
    output: compileFailed ? compile.output || "" : run.output || "",
    // A killed process has no exit code. Defaulting that to 0 would report a
    // timed-out program as a clean success to anything reading exitCode.
    exitCode: compileFailed
      ? compile.code
      : (run.code ?? (limitExceeded ? null : 0)),
    signal: run.signal || null,
    compileError: compileFailed ? compile.stderr || compile.output || "" : null,
    // Null on an ordinary result. When set, `limitError` is the whole message
    // the UI should show — callers must not fall back to stderr, which for a
    // kill is either empty or raw shell noise ("Killed", "line 3: 3 Killed").
    limitExceeded,
    limitError: limitExceeded
      ? limitMessage(limitExceeded, compileLimit ? "compile" : "run")
      : null,
  };
}

module.exports = {
  executeCode,
  ExecutionError,
  LANGUAGE_MAP,
  PISTON_URL,
};
