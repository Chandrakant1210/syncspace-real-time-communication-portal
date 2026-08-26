import { createPortal } from "react-dom";

import { avatarTint, getInitials } from "../utils/initials";

const tones = {
  join: {
    ring: "ring-emerald-100",
    dot: "bg-emerald-500",
    label: "text-emerald-700",
  },
  leave: {
    ring: "ring-slate-200",
    dot: "bg-slate-400",
    label: "text-slate-500",
  },
  info: {
    ring: "ring-indigo-100",
    dot: "bg-indigo-500",
    label: "text-indigo-700",
  },
};

/**
 * Bottom-right presence notifications ("Alice joined").
 *
 * Portalled so the room's scroll container cannot clip it, and marked
 * aria-live="polite" so a screen reader hears arrivals without being
 * interrupted mid-sentence.
 */
function ToastStack({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Room activity"
      className="pointer-events-none fixed bottom-4 right-4 z-40 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const tone = tones[toast.tone] ?? tones.info;

        return (
          <div
            key={toast.id}
            className={`animate-fade-up pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-lift ring-1 ring-inset backdrop-blur-xl ${tone.ring}`}
          >
            <span
              aria-hidden="true"
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[11px] font-semibold text-white ${avatarTint(
                toast.userId || toast.title
              )}`}
            >
              {getInitials(toast.title)}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${tone.dot}`}
              />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-900">
                {toast.title}
              </p>
              <p className={`text-[11px] font-medium ${tone.label}`}>
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss?.(toast.id)}
              aria-label="Dismiss"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-3.5 w-3.5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export default ToastStack;
