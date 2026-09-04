import { useEffect, useState } from "react";
import { connectSocket } from "../services/socket";

import CodeMirror from "@uiw/react-codemirror";

import { javascript } from "@codemirror/lang-javascript";
// import { html } from "@codemirror/lang-html";
// import { css } from "@codemirror/lang-css";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";

const DEFAULT_CODE = `// SyncSpace Code Editor

function hello() {
  console.log("Hello from SyncSpace!");
}

hello();
`;

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
//   { value: "html", label: "HTML" },
//   { value: "css", label: "CSS" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
];

function getLanguageExtension(language) {
  switch (language) {
    // case "html":
    //   return html();

    // case "css":
    //   return css();

    case "c":
    case "cpp":
      return cpp();

    case "java":
      return java();

    case "python":
      return python();

    case "javascript":
    default:
      return javascript();
  }
}

function getDefaultCode(language) {
  switch (language) {
    case "html":
      return `<div>
  <h1>Hello from SyncSpace!</h1>
  <p>Collaborative HTML editor.</p>
</div>
`;

    case "css":
      return `body {
  font-family: Arial, sans-serif;
}

h1 {
  color: #4f46e5;
}
`;

    case "c":
      return `#include <stdio.h>

int main() {
    printf("Hello from SyncSpace!\\n");
    return 0;
}
`;

    case "cpp":
      return `#include <iostream>

using namespace std;

int main() {
    cout << "Hello from SyncSpace!" << endl;
    return 0;
}
`;

    case "java":
      return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from SyncSpace!");
    }
}
`;

    case "python":
      return `def hello():
    print("Hello from SyncSpace!")

hello()
`;

    case "javascript":
    default:
      return DEFAULT_CODE;
  }
}

function CodeEditor({ roomId }) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  /* -------------------------------------------------------------- */
  /*  Code editor socket synchronization                             */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (!roomId) return;

    const socketInstance = connectSocket();

    const handleCodeState = ({
      roomId: incomingRoomId,
      code: incomingCode,
      language: incomingLanguage,
    } = {}) => {
      if (String(incomingRoomId) !== String(roomId)) return;

      if (typeof incomingCode === "string" && incomingCode.length > 0) {
        setCode(incomingCode);
      }

      if (
        typeof incomingLanguage === "string" &&
        LANGUAGES.some((item) => item.value === incomingLanguage)
      ) {
        setLanguage(incomingLanguage);
      }
    };

    const handleCodeUpdate = ({
      roomId: incomingRoomId,
      code: incomingCode,
      language: incomingLanguage,
    } = {}) => {
      if (String(incomingRoomId) !== String(roomId)) return;

      if (typeof incomingCode === "string") {
        setCode(incomingCode);
      }

      if (
        typeof incomingLanguage === "string" &&
        LANGUAGES.some((item) => item.value === incomingLanguage)
      ) {
        setLanguage(incomingLanguage);
      }
    };

    socketInstance.on("code-editor:state", handleCodeState);
    socketInstance.on("code-editor:update", handleCodeUpdate);

    socketInstance.emit("code-editor:join", {
      roomId,
    });

    return () => {
      socketInstance.off("code-editor:state", handleCodeState);
      socketInstance.off("code-editor:update", handleCodeUpdate);
    };
  }, [roomId]);

  /* -------------------------------------------------------------- */
  /*  Local code change + broadcast                                  */
  /* -------------------------------------------------------------- */

  const handleCodeChange = (value) => {
    setCode(value);

    if (!roomId) return;

    const socketInstance = connectSocket();

    socketInstance.emit("code-editor:update", {
      roomId,
      code: value,
      language,
    });
  };

  /* -------------------------------------------------------------- */
  /*  Language change + broadcast                                    */
  /* -------------------------------------------------------------- */

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;

    setLanguage(newLanguage);

    // Change the starter code when switching language.
    setCode(getDefaultCode(newLanguage));

    setOutput("");

    if (!roomId) return;

    const socketInstance = connectSocket();

    socketInstance.emit("code-editor:update", {
      roomId,
      code: getDefaultCode(newLanguage),
      language: newLanguage,
    });
  };

  /* -------------------------------------------------------------- */
  /*  Run code                                                       */
  /* -------------------------------------------------------------- */

  const runCode = () => {
    setOutput("");

    /*
     * JavaScript can currently be executed in the browser.
     *
     * Other languages need a real backend/compiler execution service.
     * We deliberately do not pretend that browser JavaScript can execute
     * C, C++, Java or Python.
     */

    if (language !== "javascript") {
      setOutput(
        `${LANGUAGES.find((item) => item.value === language)?.label} execution is not available yet.`
      );
      return;
    }

    try {
      const logs = [];

      const fakeConsole = {
        log: (...args) => {
          logs.push(
            args
              .map((value) =>
                typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)
              )
              .join(" ")
          );
        },
      };

      const execute = new Function("console", code);

      execute(fakeConsole);

      setOutput(
        logs.join("\n") || "Code executed successfully."
      );
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  /* -------------------------------------------------------------- */
  /*  Clear output                                                   */
  /* -------------------------------------------------------------- */

  const clearOutput = () => {
    setOutput("");
  };

  const selectedLanguage =
    LANGUAGES.find((item) => item.value === language)?.label ||
    "JavaScript";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      {/* ---------------------------------------------------------- */}
      {/* Header                                                       */}
      {/* ---------------------------------------------------------- */}

      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Code Editor
          </h2>

          <p className="text-sm text-slate-500">
            Write and run {selectedLanguage}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="code-language"
            className="text-xs font-medium text-slate-500"
          >
            Language
          </label>

          <select
            id="code-language"
            value={language}
            onChange={handleLanguageChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={runCode}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            ▶ Run
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Editor                                                       */}
      {/* ---------------------------------------------------------- */}

      <div className="border-b border-slate-200">
        <CodeMirror
          value={code}
          height="400px"
          extensions={[getLanguageExtension(language)]}
          onChange={handleCodeChange}
          theme="light"
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Output                                                       */}
      {/* ---------------------------------------------------------- */}

      <div>
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Output
          </h3>

          <button
            type="button"
            onClick={clearOutput}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
        </div>

        <pre className="min-h-[120px] whitespace-pre-wrap bg-slate-950 p-4 text-sm text-slate-200">
          {output || "Run your code to see the output here."}
        </pre>
      </div>
    </div>
  );
}

export default CodeEditor;