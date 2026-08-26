const states = {
  connecting: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
    label: "Connecting to the live session…",
    spin: true,
  },
  reconnecting: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
    label: "Reconnecting — presence may be out of date.",
    spin: true,
  },
  reconnected: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
    label: "Back online. Presence is live again.",
    spin: false,
  },
  error: {
    wrap: "border-red-200 bg-red-50 text-red-900",
    dot: "bg-red-500",
    label: "Live session unavailable — the room still works, presence does not.",
    spin: false,
  },
};

/**
 * Thin status strip above the room workspace. Renders nothing while the socket
 * is healthy, so a working room stays free of chrome.
 */
function ConnectionBanner({ status, detail }) {
  const state = states[status];
  if (!state) return null;

  return (
    <div
      role="status"
      className={`animate-fade-in mb-4 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-soft ${state.wrap}`}
    >
      {state.spin ? (
        <span
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70`}
        />
      ) : (
        <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${state.dot}`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${state.dot}`} />
        </span>
      )}

      <span className="min-w-0 flex-1">{detail || state.label}</span>
    </div>
  );
}

export default ConnectionBanner;
