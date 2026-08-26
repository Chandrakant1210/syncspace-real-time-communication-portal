import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

/**
 * Centred dialog rendered into document.body.
 *
 * Portalled rather than inlined because Layout's scroll container and the
 * cards' hover transforms would otherwise become the containing block for a
 * `fixed` overlay.
 *
 * `busy` disables the escape/backdrop dismissals so a request in flight cannot
 * be abandoned halfway.
 */
function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  size = "md",
  busy = false,
  closeLabel = "Close",
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const requestClose = useCallback(() => {
    if (!busy) onClose?.();
  }, [busy, onClose]);

  /* Body scroll lock + focus handling for the lifetime of the dialog. */
  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Prefer the first real control; fall back to the panel itself.
    const focusTimer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(FOCUSABLE);
      (first ?? panel).focus();
    }, 0);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      const target = restoreFocusRef.current;
      if (target?.isConnected) target.focus();
    };
  }, [open]);

  /* Escape to dismiss, Tab kept inside the panel. */
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement
      );
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, requestClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="animate-fade-in absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`animate-fade-up relative flex max-h-full w-full flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-white shadow-float focus:outline-none sm:rounded-3xl ${
          sizes[size] ?? sizes.md
        }`}
      >
        <header className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
              {icon}
            </span>
          )}

          <div className="min-w-0 flex-1">
            {title && (
              <h2
                id={titleId}
                className="text-base font-semibold tracking-tight text-slate-900"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-[13px] leading-relaxed text-slate-500"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label={closeLabel}
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-40"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
