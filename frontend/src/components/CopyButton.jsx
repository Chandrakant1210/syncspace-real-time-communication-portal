import useClipboard from "../hooks/useClipboard";

/**
 * Copy-to-clipboard control used for room codes.
 *
 * `variant="chip"` renders the value itself as a monospace pill (room cards,
 * room header); `variant="icon"` is a bare icon button for when the value is
 * already displayed alongside.
 */
function CopyButton({
  value,
  label = "Copy room code",
  variant = "chip",
  tone = "light",
  className = "",
}) {
  const { copied, copy } = useClipboard();

  const icon = copied ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  const tones = {
    light: copied
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
    onDark: copied
      ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
      : "border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white",
  };

  const shape =
    variant === "icon"
      ? "h-7 w-7 justify-center"
      : "h-7 gap-1.5 px-2 font-mono text-[12px] font-semibold tracking-[0.14em]";

  return (
    <button
      type="button"
      onClick={(event) => {
        // Room cards wrap the whole tile in a link — don't navigate on copy.
        event.preventDefault();
        event.stopPropagation();
        copy(value);
      }}
      title={copied ? "Copied" : label}
      aria-label={copied ? `${label} — copied` : label}
      className={[
        "inline-flex shrink-0 items-center rounded-lg border transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
        shape,
        tones[tone] ?? tones.light,
        className,
      ].join(" ")}
    >
      {variant === "chip" && <span>{value}</span>}
      {icon}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}

export default CopyButton;
