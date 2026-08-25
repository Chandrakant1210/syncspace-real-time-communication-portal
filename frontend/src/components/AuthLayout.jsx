import { Link } from "react-router-dom";

/** Brand mark — the looping-arrows glyph, sized by the caller. */
function BrandMark({ className = "h-5.5 w-5.5" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.5-4" />
      <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.5 4" />
      <path d="M19.5 3v4h-4" />
      <path d="M4.5 21v-4h4" />
    </svg>
  );
}

const icons = {
  bolt: <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

/** Default marketing copy for the brand panel; pages may override via `panel`. */
const defaultPanel = {
  eyebrow: "Real-time collaboration",
  heading: "Where your team stays in sync.",
  blurb:
    "Rooms, presence and messaging that update the instant someone types — no refresh, no waiting.",
  points: [
    {
      icon: "bolt",
      title: "Instant messaging",
      text: "Socket-powered delivery in milliseconds.",
    },
    {
      icon: "users",
      title: "Live presence",
      text: "See who is online, and in which room.",
    },
    {
      icon: "shield",
      title: "Private by default",
      text: "Token-based sessions on every request.",
    },
  ],
};

const avatarTints = [
  "from-amber-300 to-orange-400",
  "from-emerald-300 to-teal-400",
  "from-sky-300 to-indigo-400",
];

/**
 * Full-screen shell for the standalone auth pages — no Navbar, no Sidebar.
 *
 * Two panes on lg+: a dark gradient brand panel on the left and the form card
 * on the right. Below lg the brand panel is dropped entirely and the card
 * centres on a soft indigo wash, with a compact brand mark above it.
 */
function AuthLayout({ title, subtitle, children, footer, panel }) {
  const side = { ...defaultPanel, ...panel };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* -------------------------------------------------------------
          Brand panel (lg+)
      ------------------------------------------------------------- */}
      <aside className="relative hidden w-[46%] shrink-0 overflow-hidden bg-slate-950 lg:flex xl:w-1/2">
        {/* Layered wash — all decorative. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-700 via-violet-700 to-indigo-900"
        />
        <div
          aria-hidden="true"
          className="animate-drift pointer-events-none absolute -left-32 -top-24 h-128 w-128 rounded-full bg-fuchsia-500/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="animate-drift-slow pointer-events-none absolute -bottom-32 -right-24 h-136 w-136 rounded-full bg-sky-400/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-dot-grid pointer-events-none absolute inset-0 opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent"
        />

        <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Brand */}
          <Link
            to="/"
            className="animate-fade-up flex w-fit items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-indigo-800"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
              <BrandMark />
            </span>
            <span className="text-xl font-semibold tracking-tight text-white">
              SyncSpace
            </span>
          </Link>

          {/* Pitch */}
          <div className="max-w-md py-10">
            <span
              style={{ animationDelay: "80ms" }}
              className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-100 ring-1 ring-inset ring-white/20 backdrop-blur-sm"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-300" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {side.eyebrow}
            </span>

            <h2
              style={{ animationDelay: "140ms" }}
              className="animate-fade-up mt-5 text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-[2.75rem]"
            >
              {side.heading}
            </h2>

            <p
              style={{ animationDelay: "200ms" }}
              className="animate-fade-up mt-4 text-base leading-relaxed text-indigo-100/80"
            >
              {side.blurb}
            </p>

            <ul className="mt-10 space-y-5">
              {side.points.map((point, i) => (
                <li
                  key={point.title}
                  style={{ animationDelay: `${260 + i * 70}ms` }}
                  className="animate-fade-up flex items-start gap-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4.5 w-4.5"
                    >
                      {icons[point.icon] ?? icons.bolt}
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">
                      {point.title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-indigo-100/70">
                      {point.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer strip */}
          <div
            style={{ animationDelay: "500ms" }}
            className="animate-fade-up flex items-center gap-3 text-sm text-indigo-100/70"
          >
            <span className="flex -space-x-2">
              {avatarTints.map((tint) => (
                <span
                  key={tint}
                  aria-hidden="true"
                  className={`h-7 w-7 rounded-full bg-linear-to-br ${tint} ring-2 ring-indigo-800/60`}
                />
              ))}
            </span>
            Teams are collaborating on SyncSpace right now.
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          Form panel
      ------------------------------------------------------------- */}
      <div className="relative flex flex-1 flex-col overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-indigo-50 via-slate-50 to-slate-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl lg:hidden"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-violet-300/25 blur-3xl lg:hidden"
        />

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          {/* Compact brand — the panel carries it on large screens. */}
          <Link
            to="/"
            className="animate-fade-up mx-auto mb-6 flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 lg:hidden"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-glow ring-1 ring-inset ring-white/20">
              <BrandMark />
            </span>
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              SyncSpace
            </span>
          </Link>

          {/* Card */}
          <main
            style={{ animationDelay: "80ms" }}
            className="animate-fade-up relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-float backdrop-blur-xl sm:p-8"
          >
            {/* Hairline of brand colour along the top edge. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-400/70 to-transparent"
            />

            <header className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              )}
            </header>

            {children}
          </main>

          {footer && (
            <p
              style={{ animationDelay: "140ms" }}
              className="animate-fade-up mt-6 text-center text-sm text-slate-600"
            >
              {footer}
            </p>
          )}

          <p className="mt-8 text-center text-[11px] text-slate-400">
            SyncSpace · Real-Time Communication Portal
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
