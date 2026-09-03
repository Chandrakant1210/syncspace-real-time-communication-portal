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

const REQUEST_TIMEOUT_MS = Number(process.env.PISTON_TIMEOUT_MS) || 15000;

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

  // 4xx: our payload was wrong (bad language/version), not the user's code.
  return new ExecutionError(
    upstreamMessage || "The code execution service rejected this request.",
    502,
    { upstreamStatus: status, upstreamMessage }
  );
}

/**
 * Executes source code using the Piston execution API.
 *
 * Supported: JavaScript, Python, Java, C, C++
 *
 * A program that compiles-and-fails is a *success* here — the caller gets the
 * stderr and exit code. Only the runner being broken throws.
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

  const compileFailed = compile && compile.code !== 0;

  return {
    language,
    stdout: run.stdout || "",
    stderr: compileFailed ? compile.stderr || "" : run.stderr || "",
    output: compileFailed ? compile.output || "" : run.output || "",
    exitCode: compileFailed ? compile.code : (run.code ?? 0),
    signal: run.signal || null,
    compileError: compileFailed ? compile.stderr || compile.output || "" : null,
  };
}

module.exports = {
  executeCode,
  ExecutionError,
  LANGUAGE_MAP,
  PISTON_URL,
};
