import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import Button from "../components/Button";

const iconProps = {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-5 w-5",
};

function greetingFor(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* Placeholder figures — swap for API data once the rooms endpoint lands. */
const stats = [
  {
    label: "Active Rooms",
    value: "3",
    caption: "2 started in the last hour",
    tint: "bg-indigo-50 border-indigo-100/80",
    badge: "bg-white text-indigo-600 ring-indigo-100",
    valueColor: "text-indigo-950",
    icon: (
      <svg {...iconProps}>
        <path d="m22 8-6 4 6 4V8Z" />
        <rect x="2" y="6" width="14" height="12" rx="2.5" />
      </svg>
    ),
  },
  {
    label: "Online Now",
    value: "8",
    caption: "Across all workspaces",
    tint: "bg-violet-50 border-violet-100/80",
    badge: "bg-white text-violet-600 ring-violet-100",
    valueColor: "text-violet-950",
    icon: (
      <svg {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    label: "Sessions Today",
    value: "12",
    caption: "+3 vs. yesterday",
    tint: "bg-emerald-50 border-emerald-100/80",
    badge: "bg-white text-emerald-600 ring-emerald-100",
    valueColor: "text-emerald-950",
    icon: (
      <svg {...iconProps}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    label: "Team Members",
    value: "4",
    caption: "1 invite pending",
    tint: "bg-amber-50 border-amber-100/80",
    badge: "bg-white text-amber-600 ring-amber-100",
    valueColor: "text-amber-950",
    icon: (
      <svg {...iconProps}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const quickActions = [
  {
    title: "Create Room",
    description: "Spin up a fresh space and invite your team in.",
    to: "/rooms",
    gradient: "from-indigo-500 to-indigo-600",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    title: "Open Whiteboard",
    description: "Sketch ideas together on an infinite canvas.",
    to: "/whiteboard",
    gradient: "from-violet-500 to-violet-600",
    icon: (
      <svg {...iconProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    title: "Code Editor",
    description: "Pair-program with live cursors and syntax highlighting.",
    to: "/code-editor",
    gradient: "from-emerald-500 to-emerald-600",
    icon: (
      <svg {...iconProps}>
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
      </svg>
    ),
  },
  {
    title: "Invite Team",
    description: "Send a link and get your teammates onboard.",
    gradient: "from-amber-500 to-orange-600",
    icon: (
      <svg {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
  },
];

const milestones = [
  { date: "Aug 22", title: "Authentication", status: "next" },
  { date: "Aug 23", title: "Rooms", status: "upcoming" },
  { date: "Aug 24", title: "Real-time Sync", status: "upcoming" },
  { date: "Aug 25", title: "Whiteboard", status: "upcoming" },
  { date: "Aug 26", title: "Code Editor", status: "upcoming" },
];

// Subtle dot grid for the hero — kept inline so the pattern lives with the element.
const dotPattern = {
  backgroundImage:
    "radial-gradient(circle at center, rgb(255 255 255 / 0.28) 1px, transparent 1px)",
  backgroundSize: "18px 18px",
};

function Dashboard() {
  const now = new Date();
  const greeting = greetingFor(now.getHours());
  const today = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout userName="Sargun">
      {/* ---------------- HERO ---------------- */}
      <section className="animate-fade-up relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 shadow-lift sm:p-8">
        <div aria-hidden="true" className="absolute inset-0" style={dotPattern} />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-indigo-200">
              {today}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {greeting}, Sargun <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-indigo-100">
              Your workspace is synced and ready. Jump back into a room, or start
              something new with your team.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="md"
              className="text-white! ring-1 ring-white/30 hover:bg-white/15! hover:text-white!"
            >
              Invite
            </Button>
            <Button variant="secondary" size="md" className="border-transparent!">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                className="h-4 w-4 text-indigo-600"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Room
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{ animationDelay: `${60 + i * 60}ms` }}
            className={`animate-fade-up group rounded-2xl border p-4 shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift ${stat.tint}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-slate-600">{stat.label}</p>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-soft ring-1 ring-inset transition-transform duration-300 group-hover:scale-110 ${stat.badge}`}
              >
                {stat.icon}
              </span>
            </div>
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight ${stat.valueColor}`}
            >
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">{stat.caption}</p>
          </div>
        ))}
      </div>

      {/* ---------------- BODY: 2/3 + 1/3 ---------------- */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT — Quick Actions */}
        <section
          style={{ animationDelay: "300ms" }}
          className="animate-fade-up lg:col-span-2"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500">Jump straight in</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Tile = action.to ? Link : "button";
              const tileProps = action.to
                ? { to: action.to }
                : { type: "button" };

              return (
                <Tile
                  key={action.title}
                  {...tileProps}
                  className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-soft transition-transform duration-300 group-hover:scale-105 ${action.gradient}`}
                  >
                    {action.icon}
                  </span>

                  <span className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    {action.title}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 -translate-x-1 text-slate-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-indigo-600 group-hover:opacity-100"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-slate-500">
                    {action.description}
                  </span>
                </Tile>
              );
            })}
          </div>
        </section>

        {/* RIGHT — Activity + Timeline */}
        <div
          style={{ animationDelay: "360ms" }}
          className="animate-fade-up flex flex-col gap-5"
        >
          {/* Recent Activity */}
          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Activity
              </h2>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>

            <div className="flex flex-col items-center px-4 py-7 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-slate-50 to-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200/70">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <p className="mt-2 text-[13px] font-medium text-slate-700">
                Nothing here yet
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                Team activity appears the moment someone joins a room.
              </p>
            </div>
          </section>

          {/* Project Timeline */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Project Timeline
              </h2>
              <span className="text-[11px] font-medium text-slate-400">
                This week
              </span>
            </div>

            <ol className="relative space-y-3 pl-5">
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-[5px] top-2 w-px bg-slate-200"
              />

              {milestones.map((milestone) => {
                const isNext = milestone.status === "next";
                return (
                  <li key={milestone.date} className="relative">
                    <span
                      aria-hidden="true"
                      className={
                        isNext
                          ? "absolute -left-5 top-1 h-[11px] w-[11px] rounded-full border-2 border-white bg-indigo-600 ring-4 ring-indigo-100"
                          : "absolute -left-[18px] top-1.5 h-[7px] w-[7px] rounded-full bg-slate-300"
                      }
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={
                          isNext
                            ? "text-[13px] font-semibold text-slate-900"
                            : "text-[13px] font-medium text-slate-500"
                        }
                      >
                        {milestone.title}
                      </p>
                      <span
                        className={
                          isNext
                            ? "shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-100"
                            : "shrink-0 text-[11px] text-slate-400"
                        }
                      >
                        {isNext ? "Up next" : milestone.date}
                      </span>
                    </div>
                    {isNext && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {milestone.date} · starts tomorrow
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
