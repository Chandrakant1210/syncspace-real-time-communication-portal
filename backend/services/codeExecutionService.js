const axios = require("axios");

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_MAP = {
  javascript: {
    language: "javascript",
    version: "18.15.0",
    filename: "main.js",
  },

  python: {
    language: "python",
    version: "3.10.0",
    filename: "main.py",
  },

  java: {
    language: "java",
    version: "15.0.2",
    filename: "Main.java",
  },

  c: {
    language: "c",
    version: "10.2.0",
    filename: "main.c",
  },

  cpp: {
    language: "c++",
    version: "10.2.0",
    filename: "main.cpp",
  },
};

/**
 * Executes source code using the Piston execution API.
 *
 * Supported:
 * JavaScript, Python, Java, C, C++
 */
async function executeCode({ language, code, stdin = "" }) {
  if (!language || !code) {
    throw new Error("Language and code are required.");
  }

  const selectedLanguage = LANGUAGE_MAP[language];

  if (!selectedLanguage) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await axios.post(
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
    {
      timeout: 15000,
    }
  );

  const result = response.data;

  return {
    language,
    stdout: result.run?.stdout || "",
    stderr: result.run?.stderr || "",
    output: result.run?.output || "",
    exitCode: result.run?.code ?? 0,
    signal: result.run?.signal || null,
  };
}

module.exports = {
  executeCode,
  LANGUAGE_MAP,
};