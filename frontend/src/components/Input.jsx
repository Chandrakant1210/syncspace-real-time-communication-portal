import { useId } from "react";

function Input({
  label,
  error,
  helperText,
  type = "text",
  name,
  id,
  required = false,
  disabled = false,
  className = "",
  ...props
}) {
  const autoId = useId();
  const inputId = id || name || autoId;
  const describedBy = error
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-help`
      : undefined;

  const fieldClasses = [
    "peer h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900",
    "placeholder:text-slate-400 shadow-soft",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-4",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
      : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/15",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full">
      {/* col-reverse puts the input first in the DOM (so `peer-focus:` can style
          the label) while still rendering the label above it. */}
      <div className="flex flex-col-reverse">
        <input
          id={inputId}
          name={name}
          type={type}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={fieldClasses}
          {...props}
        />

        {label && (
          <label
            htmlFor={inputId}
            className={[
              "mb-1.5 block text-sm font-medium transition-colors duration-200",
              error
                ? "text-red-600"
                : "text-slate-700 peer-focus:text-indigo-600",
            ].join(" ")}
          >
            {label}
            {required && <span className="ml-0.5 text-indigo-500">*</span>}
          </label>
        )}
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="h-3.5 w-3.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="mt-1.5 text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default Input;
