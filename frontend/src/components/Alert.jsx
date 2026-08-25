const tones = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-900",
    icon: "text-red-600",
    body: "text-red-700",
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </>
    ),
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
    body: "text-amber-800",
    path: (
      <>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "text-emerald-600",
    body: "text-emerald-700",
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </>
    ),
  },
  info: {
    wrap: "border-indigo-200 bg-indigo-50 text-indigo-900",
    icon: "text-indigo-600",
    body: "text-indigo-700",
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
  },
};

/**
 * Inline status banner for form-level feedback.
 * Errors/warnings announce immediately; success is polite.
 */
function Alert({ tone = "info", title, children, className = "" }) {
  const t = tones[tone] ?? tones.info;

  return (
    <div
      role={tone === "success" || tone === "info" ? "status" : "alert"}
      aria-live={tone === "success" || tone === "info" ? "polite" : "assertive"}
      className={`animate-fade-in flex items-start gap-2.5 rounded-xl border p-3 shadow-soft ${t.wrap} ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`mt-px h-4 w-4 shrink-0 ${t.icon}`}
      >
        {t.path}
      </svg>

      <div className="min-w-0 flex-1">
        {title && <p className="text-[13px] font-semibold">{title}</p>}
        {children && (
          <p className={`text-xs leading-relaxed ${title ? "mt-0.5" : ""} ${t.body}`}>
            {children}
          </p>
        )}
      </div>
    </div>
  );
}

export default Alert;
