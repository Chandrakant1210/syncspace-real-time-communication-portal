import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../components/Alert";
import Button from "../components/Button";
import Layout from "../components/Layout";
import RoomDialogs from "../components/RoomDialogs";
import RoomList from "../components/RoomList";
import useRoomDialogs from "../hooks/useRoomDialogs";
import useRooms from "../hooks/useRooms";
import { getStoredUser } from "../services/api";

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

function idOf(person) {
  if (!person) return "";
  return String(typeof person === "object" ? person._id : person);
}

/**
 * Every figure here is derived from GET /api/rooms — the caller's own rooms —
 * except "Team Members", which is the fixed size of the project team and is
 * captioned as such. Nothing on this page is invented.
 */
function buildStats(rooms, currentUserId) {
  const owned = rooms.filter((room) => idOf(room.owner) === String(currentUserId));

  const collaborators = new Set();
  rooms.forEach((room) => {
    (Array.isArray(room.members) ? room.members : []).forEach((member) => {
      const id = idOf(member);
      if (id && id !== String(currentUserId)) collaborators.add(id);
    });
  });

  return [
    {
      label: "Active Rooms",
      value: rooms.length,
      caption:
        rooms.length === 0
          ? "Create one to get started"
          : "Rooms you are a member of",
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
      label: "Rooms You Own",
      value: owned.length,
      caption:
        rooms.length - owned.length > 0
          ? `${rooms.length - owned.length} shared with you`
          : "You are the owner of these",
      tint: "bg-violet-50 border-violet-100/80",
      badge: "bg-white text-violet-600 ring-violet-100",
      valueColor: "text-violet-950",
      icon: (
        <svg {...iconProps}>
          <path d="M12 2 15 8.5l7 1-5 4.9 1.2 7-6.2-3.3L5.8 21.4 7 14.4l-5-4.9 7-1L12 2Z" />
        </svg>
      ),
    },
    {
      label: "Collaborators",
      value: collaborators.size,
      caption:
        collaborators.size === 0
          ? "Share a room code to invite"
          : "People across your rooms",
      tint: "bg-emerald-50 border-emerald-100/80",
      badge: "bg-white text-emerald-600 ring-emerald-100",
      valueColor: "text-emerald-950",
      icon: (
        <svg {...iconProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      ),
    },
    {
      label: "Team Members",
      value: 4,
      caption: "SyncSpace project team",
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
}

/* Real project schedule — see backend/docs/API_LIST.md for what each day ships. */
const milestones = [
  { date: "Aug 22", title: "Authentication", status: "done" },
  { date: "Aug 23", title: "Rooms", status: "done" },
  { date: "Aug 24", title: "Real-time Sync", status: "done" },
  { date: "Aug 25", title: "Whiteboard", status: "next" },
  { date: "Aug 26", title: "Code Editor", status: "upcoming" },
];

// Subtle dot grid for the hero — kept inline so the pattern lives with the element.
const dotPattern = {
  backgroundImage:
    "radial-gradient(circle at center, rgb(255 255 255 / 0.28) 1px, transparent 1px)",
  backgroundSize: "18px 18px",
};

function Dashboard() {
  const user = getStoredUser();
  const currentUserId = user?._id;
  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "there";

  const { rooms, status, error, reload } = useRooms();

  const [notice, setNotice] = useState(null);
  const handleNotice = useCallback((next) => setNotice(next), []);
  const dialogs = useRoomDialogs({ reload, onNotice: handleNotice });

  const stats = buildStats(rooms, currentUserId);
  const statsReady = status === "ready";

  const now = new Date();
  const greeting = greetingFor(now.getHours());
  const today = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const quickActions = [
    {
      title: "Create Room",
      description: "Spin up a fresh space and share the code with your team.",
      onClick: dialogs.openCreate,
      gradient: "from-indigo-500 to-indigo-600",
      icon: (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      ),
    },
    {
      title: "Join a Room",
      description: "Got a 6-character code? Drop it in and you are there.",
      onClick: dialogs.openJoin,
      gradient: "from-sky-500 to-indigo-600",
      icon: (
        <svg {...iconProps}>
          <path d="m15.5 7.5 5-5" />
          <path d="m18 5 2 2" />
          <circle cx="8.5" cy="15.5" r="5.5" />
        </svg>
      ),
    },
    {
      title: "Whiteboard",
      description: "A shared canvas inside every room.",
      scope: "Aug 25",
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
      description: "Pair-program with live cursors and shared output.",
      scope: "Aug 26",
      gradient: "from-emerald-500 to-emerald-600",
      icon: (
        <svg {...iconProps}>
          <path d="m16 18 6-6-6-6" />
          <path d="m8 6-6 6 6 6" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
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
              {greeting}, {firstName} <span aria-hidden="true">👋</span>
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
              onClick={dialogs.openJoin}
              className="text-white! ring-1 ring-white/30 hover:bg-white/15! hover:text-white!"
            >
              Join with code
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={dialogs.openCreate}
              className="border-transparent!"
            >
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

      {notice && (
        <Alert tone={notice.tone} title={notice.title} className="mt-5">
          {notice.message}
        </Alert>
      )}

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

            {/* No number until the real one has arrived. */}
            {statsReady || stat.label === "Team Members" ? (
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${stat.valueColor}`}
              >
                {stat.value}
              </p>
            ) : (
              <p className="mt-2 h-8 w-10 animate-pulse rounded-lg bg-white/70" />
            )}

            <p className="mt-0.5 text-[11px] text-slate-500">
              {statsReady || stat.label === "Team Members"
                ? stat.caption
                : status === "error"
                  ? "Unavailable right now"
                  : "Loading…"}
            </p>
          </div>
        ))}
      </div>

      {/* ---------------- MY ROOMS ---------------- */}
      <section style={{ animationDelay: "240ms" }} className="animate-fade-up mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-slate-900">My Rooms</h2>
            {status === "ready" && rooms.length > 0 && (
              <span className="text-xs text-slate-500">
                {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
              </span>
            )}
          </div>

          <Link
            to="/rooms"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            View all
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <RoomList
          rooms={rooms.slice(0, 6)}
          status={status}
          error={error}
          onRetry={() => reload()}
          currentUserId={currentUserId}
          onLeave={dialogs.requestLeave}
          onCreate={dialogs.openCreate}
          onJoin={dialogs.openJoin}
          skeletonCount={3}
        />
      </section>

      {/* ---------------- BODY: 2/3 + 1/3 ---------------- */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
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
              const interactive = Boolean(action.onClick);

              return (
                <div
                  key={action.title}
                  className={
                    interactive
                      ? "group relative rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-lift focus-within:border-indigo-300"
                      : "relative rounded-2xl border border-dashed border-slate-300 bg-white/60"
                  }
                >
                  {interactive ? (
                    <button
                      type="button"
                      onClick={action.onClick}
                      className="flex w-full flex-col p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:rounded-2xl"
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
                    </button>
                  ) : (
                    /* Not built yet — shown, but never pretending to be clickable. */
                    <div className="flex flex-col p-5">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white opacity-45 shadow-soft ${action.gradient}`}
                      >
                        {action.icon}
                      </span>

                      <span className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                        {action.title}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {action.scope}
                        </span>
                      </span>
                      <span className="mt-1 text-xs leading-relaxed text-slate-400">
                        {action.description} Opens inside a room once it ships.
                      </span>
                    </div>
                  )}
                </div>
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
                No activity feed yet
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                Join and leave events are live inside a room — open one to see who
                is there.
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
                className="absolute bottom-2 left-1.25 top-2 w-px bg-slate-200"
              />

              {milestones.map((milestone) => {
                const isNext = milestone.status === "next";
                const isDone = milestone.status === "done";

                return (
                  <li key={milestone.date} className="relative">
                    <span
                      aria-hidden="true"
                      className={
                        isNext
                          ? "absolute -left-5 top-1 h-2.75 w-2.75 rounded-full border-2 border-white bg-indigo-600 ring-4 ring-indigo-100"
                          : isDone
                            ? "absolute -left-4.75 top-1 h-2.25 w-2.25 rounded-full bg-emerald-500"
                            : "absolute -left-4.5 top-1.5 h-1.75 w-1.75 rounded-full bg-slate-300"
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
                            : isDone
                              ? "shrink-0 text-[11px] font-medium text-emerald-600"
                              : "shrink-0 text-[11px] text-slate-400"
                        }
                      >
                        {isNext ? "Up next" : isDone ? "Shipped" : milestone.date}
                      </span>
                    </div>
                    {isNext && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {milestone.date} · mounts inside every room
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>

      <RoomDialogs {...dialogs} currentUserId={currentUserId} />
    </Layout>
  );
}

export default Dashboard;
