import { useCallback, useEffect, useRef, useState } from "react";

let nextId = 0;

/**
 * Small transient-notification queue for presence events.
 *
 * Ids come from a module counter rather than Date.now() so two events in the
 * same millisecond (two people joining at once) cannot collide on a React key.
 */
export default function useToasts({ duration = 3600, max = 4 } = {}) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast) => {
      nextId += 1;
      const id = nextId;

      setToasts((prev) => [...prev, { id, tone: "info", ...toast }].slice(-max));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );

      return id;
    },
    [dismiss, duration, max]
  );

  // Cancel every pending timer when the page unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  return { toasts, push, dismiss };
}
