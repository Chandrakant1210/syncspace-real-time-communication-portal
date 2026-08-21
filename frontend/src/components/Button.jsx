const base = [
  "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium",
  "transition-all duration-200 ease-out",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  "active:scale-[0.98]",
  "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
].join(" ");

const variants = {
  primary: [
    "bg-linear-to-b from-indigo-500 to-indigo-600 text-white shadow-soft",
    "hover:from-indigo-500 hover:to-indigo-700 hover:shadow-card",
    "active:from-indigo-600 active:to-indigo-700",
    "focus-visible:ring-indigo-500",
  ].join(" "),
  secondary: [
    "border border-slate-200 bg-white text-slate-700 shadow-soft",
    "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
    "focus-visible:ring-slate-400",
  ].join(" "),
  outline: [
    "border border-indigo-200 bg-white text-indigo-700",
    "hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800",
    "focus-visible:ring-indigo-500",
  ].join(" "),
  ghost: [
    "bg-transparent text-slate-600",
    "hover:bg-slate-100 hover:text-slate-900",
    "focus-visible:ring-slate-400",
  ].join(" "),
  danger: [
    "bg-linear-to-b from-red-500 to-red-600 text-white shadow-soft",
    "hover:from-red-500 hover:to-red-700 hover:shadow-card",
    "focus-visible:ring-red-500",
  ].join(" "),
};

const sizes = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const classes = [
    base,
    variants[variant] ?? variants.primary,
    sizes[size] ?? sizes.md,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
        />
      )}
      {children}
    </button>
  );
}

export default Button;
