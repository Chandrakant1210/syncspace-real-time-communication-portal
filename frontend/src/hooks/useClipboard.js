import { useCallback, useEffect, useRef, useState } from "react";

/**
 * navigator.clipboard is only available in secure contexts — over plain http on
 * a LAN IP (the usual "test it on my phone" setup) it is undefined. Falling
 * back to a throwaway textarea keeps the copy buttons working there.
 */
function legacyCopy(value) {
  try {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

/**
 * @param {number} resetAfter  ms before `copied` flips back to false
 * @returns {{ copied: boolean, copy: (text: string) => Promise<boolean> }}
 */
export default function useClipboard(resetAfter = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text) => {
      const value = String(text ?? "");
      let ok = false;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          ok = true;
        }
      } catch {
        ok = false; // Permission denied — fall through to the textarea trick.
      }

      if (!ok) ok = legacyCopy(value);

      if (ok) {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetAfter);
      }

      return ok;
    },
    [resetAfter]
  );

  return { copied, copy };
}
