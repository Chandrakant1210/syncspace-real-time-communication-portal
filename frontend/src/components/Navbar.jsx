import Button from "./Button";

// "Sargun Kaur" -> "SK", "Sargun" -> "SA"
function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Navbar({ userName = "User", onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-soft ring-1 ring-inset ring-white/20">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5 text-white"
            >
              <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.5-4" />
              <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.5 4" />
              <path d="M19.5 3v4h-4" />
              <path d="M4.5 21v-4h4" />
            </svg>
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            SyncSpace
          </span>
        </div>

        {/* User + actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="group flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-colors sm:pr-3 sm:hover:bg-slate-100">
            <span
              title={userName}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-soft ring-2 ring-white transition-transform duration-200 group-hover:scale-105"
            >
              {getInitials(userName)}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13px] font-medium text-slate-900">
                {userName}
              </span>
              <span className="block text-[11px] text-slate-500">Welcome back</span>
            </span>
          </div>

          <span aria-hidden="true" className="hidden h-6 w-px bg-slate-200 sm:block" />

          <Button variant="ghost" size="sm" onClick={onLogout}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
