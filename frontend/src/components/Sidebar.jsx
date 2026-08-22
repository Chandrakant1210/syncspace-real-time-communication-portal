import { NavLink } from "react-router-dom";

const iconProps = {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-5 w-5 shrink-0",
};

const icons = {
  Dashboard: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </svg>
  ),
  "My Rooms": (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Whiteboard: (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  "Code Editor": (
    <svg {...iconProps}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  ),
};

const fallbackIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

const defaultLinks = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "My Rooms", to: "/rooms" },
  { label: "Whiteboard", to: "/whiteboard" },
  { label: "Code Editor", to: "/code-editor" },
];

function Sidebar({ links = defaultLinks }) {
  const linkClasses = ({ isActive }) =>
    [
      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
      "transition-all duration-200 ease-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
      "justify-center lg:justify-start",
      isActive
        ? "bg-indigo-500/15 text-white ring-1 ring-inset ring-indigo-400/25"
        : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
    ].join(" ");

  return (
    /* Collapses to an icon-only rail below `lg` so navigation survives on mobile. */
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-800/70 bg-slate-950 px-2 py-4 lg:w-64 lg:px-3">
      <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:block">
        Workspace
      </p>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            title={link.label}
            className={linkClasses}
          >
            {({ isActive }) => (
              <>
                {/* Active pill indicator on the rail's left edge */}
                <span
                  aria-hidden="true"
                  className={[
                    "absolute left-0 h-5 w-1 rounded-r-full bg-indigo-400 transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />
                <span
                  className={
                    isActive
                      ? "text-indigo-300"
                      : "text-slate-500 transition-colors group-hover:text-slate-300"
                  }
                >
                  {link.icon ?? icons[link.label] ?? fallbackIcon}
                </span>
                <span className="hidden lg:inline">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto hidden lg:block">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-xs font-medium text-slate-300">All systems live</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Real-time sync is connected.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
