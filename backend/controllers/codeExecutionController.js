const {
  executeCode,
  LANGUAGE_MAP,
} = require("../services/codeExecutionService");

/**
 * POST /api/code/run
 *
 * Executes user-submitted source code through the sandbox service.
 */
const runCode = async (req, res) => {
  try {
    const { language, code, stdin = "" } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Language is required.",
      });
    }

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code is required.",
      });
    }

    if (typeof stdin !== "string") {
      return res.status(400).json({
        success: false,
        message: "Input must be a string.",
      });
    }

    if (!LANGUAGE_MAP[language]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`,
      });
    }

    const result = await executeCode({
      language,
      code,
      stdin,
    });

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    // ExecutionError carries the status the caller should see; anything else is
    // genuinely our fault and stays a 500 with a generic message.
    const status = error.status || 500;

    console.error(
      `[code] Execution failed (${status}):`,
      error.message,
      error.details ? JSON.stringify(error.details) : ""
    );

    return res.status(status).json({
      success: false,
      message:
        error.name === "ExecutionError"
          ? error.message
          : "Code execution failed.",
    });
  }
};

module.exports = {
  runCode,
};