import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";


import Whiteboard from "../components/Whiteboard";
import Button from "../components/Button";
import ConnectionBanner from "../components/ConnectionBanner";
import CopyButton from "../components/CopyButton";
import JoinRoomModal from "../components/JoinRoomModal";
import Layout from "../components/Layout";
import ParticipantList from "../components/ParticipantList";
import ToastStack from "../components/ToastStack";
import useRoomPresence from "../hooks/useRoomPresence";
import useToasts from "../hooks/useToasts";
import { getStoredUser, rooms as roomsApi } from "../services/api";
import { avatarTint, getInitials } from "../utils/initials";
import { describeRoomError } from "../utils/roomError";

/* The backend exposes no GET /api/rooms/:id — membership comes from the
   caller's own room list, which doubles as the access check. */
async function fetchRoomById(roomId) {
  const data = await roomsApi.myRooms();
  const list = Array.isArray(data?.rooms) ? data.rooms : [];
  return list.find((room) => String(room._id) === String(roomId)) ?? null;
}

const panels = [
  {
    key: "whiteboard",
    title: "Whiteboard",
    scope: "Aug 25 scope",
    blurb:
      "A shared infinite canvas — strokes broadcast over this room's socket channel so everyone draws on the same board.",
    accent: "from-violet-500 to-fuchsia-600",
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
  },
  {
    key: "code-editor",
    title: "Code Editor",
    scope: "Aug 26 scope",
    blurb:
      "Collaborative editing with JavaScript running in a sandboxed Web Worker, output shared with the room.",
    accent: "from-emerald-500 to-teal-600",
    icon: (
      <>
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
      </>
    ),
  },
];

/** Dashed drop-zone for a feature that will mount here later. */
function PlaceholderPanel({ panel, delay }) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-up relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-50/60 to-transparent"
      />

      <div className="relative flex flex-col items-center">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-soft ${panel.accent}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            {panel.icon}
          </svg>
        </span>

        <h2 className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-900">
          {panel.title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {panel.scope}
          </span>
        </h2>

        <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
          {panel.blurb}
        </p>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-inset ring-slate-200">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Mounts here — not built yet
        </p>
      </div>
    </section>
  );
}

function Room() {
  const { id } = useParams();

  // Read once: a new object each render would restart the presence effect.
  const user = useMemo(() => getStoredUser(), []);

  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
  const [error, setError] = useState(null);
  const [joinOpen, setJoinOpen] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* .then/.catch rather than await so the state updates live in callbacks —
     an effect body may not update state synchronously. */
  const loadRoom = useCallback(
    () =>
      fetchRoomById(id)
        .then((found) => {
          if (!mounted.current) return;
          setRoom(found);
          setError(null);
          setStatus(found ? "ready" : "missing");
        })
        .catch((caught) => {
          if (!mounted.current) return;
          setError(describeRoomError(caught, "load"));
          setStatus("error");
        }),
    [id]
  );

  /** Retry entry point — event handlers may set state synchronously. */
  const retry = useCallback(() => {
    setStatus("loading");
    return loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    loadRoom(); // status already starts as "loading"
  }, [loadRoom]);

  /* ---------------- Presence ---------------- */
  const { toasts, push, dismiss } = useToasts();

  const handleUserJoined = useCallback(
    (data) =>
      push({
        tone: "join",
        userId: data.userId,
        title: data.name || "Someone",
        message: "joined the room",
      }),
    [push]
  );

  const handleUserLeft = useCallback(
    (data) =>
      push({
        tone: "leave",
        userId: data.userId,
        title: data.name || "Someone",
        message: "left the room",
      }),
    [push]
  );

  const { onlineUsers, connection, detail } = useRoomPresence({
    // Only announce presence once membership is confirmed.
    roomId: status === "ready" ? id : undefined,
    userId: user?._id,
    userName: user?.name,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
  });

  const backLink = (
    <Link
      to="/dashboard"
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to Dashboard
    </Link>
  );

  /* ---------------- Loading ---------------- */
  if (status === "loading") {
    return (
      <Layout>
        <div aria-hidden="true" className="animate-fade-in space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
            <div className="h-3 w-32 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 flex items-center gap-3">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-64 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-56 animate-pulse rounded-2xl bg-slate-100 lg:order-2" />
            <div className="space-y-5 lg:order-1 lg:col-span-2">
              <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
        <span className="sr-only" role="status">
          Loading room
        </span>
      </Layout>
    );
  }

  /* ---------------- Not a member / load failed ---------------- */
  if (status !== "ready" || !room) {
    const isError = status === "error";

    return (
      <Layout>
        <div
          role="alert"
          className={`animate-fade-up mx-auto flex max-w-md flex-col items-center rounded-2xl border px-5 py-10 text-center ${isError ? "border-red-200/80 bg-red-50/60" : "border-slate-200/80 bg-white shadow-soft"
            }`}
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isError
                ? "bg-white text-red-600 ring-1 ring-inset ring-red-100"
                : "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200"
              }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
          </span>

          <h1
            className={`mt-3 text-sm font-semibold ${isError ? "text-red-900" : "text-slate-900"
              }`}
          >
            {isError ? error?.title : "This room is not in your list"}
          </h1>
          <p
            className={`mt-1 max-w-sm text-xs leading-relaxed ${isError ? "text-red-700" : "text-slate-500"
              }`}
          >
            {isError
              ? error?.message
              : "It may have been deleted, or you may have left it. Join again with the room code if you still have it."}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {backLink}
            {isError ? (
              <Button variant="primary" size="md" onClick={retry}>
                Try again
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={() => setJoinOpen(true)}>
                Join with a code
              </Button>
            )}
          </div>
        </div>

        {/* Mounted only while open, so its form state resets on every visit. */}
        {joinOpen && (
          <JoinRoomModal
            open
            onClose={() => setJoinOpen(false)}
            onJoined={() => {
              setJoinOpen(false);
              retry();
            }}
          />
        )}
      </Layout>
    );
  }

  /* ---------------- Ready ---------------- */
  const members = Array.isArray(room.members) ? room.members : [];
  const ownerId = String(room.owner?._id ?? room.owner ?? "");
  const onlineCount = onlineUsers.length;

  return (
    <Layout>
      {/* ---- Header ---- */}
      <header className="animate-fade-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-base font-semibold text-white shadow-soft ${avatarTint(
                room._id
              )}`}
            >
              {getInitials(room.name)}
            </span>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                {room.name}
              </h1>

              {room.description && (
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {room.description}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <CopyButton
                  value={room.roomCode}
                  label={`Copy code for ${room.name}`}
                />

                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 text-slate-400"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  </svg>
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  <span aria-hidden="true" className="relative flex h-2 w-2">
                    {onlineCount > 0 && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${onlineCount > 0 ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                    />
                  </span>
                  {onlineCount} online
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">{backLink}</div>
        </div>
      </header>

      {/* ---- Workspace ---- */}
      <div className="mt-5">
        <ConnectionBanner status={connection} detail={detail} />

        <div className="grid gap-5 lg:grid-cols-3">
          <aside
            style={{ animationDelay: "120ms" }}
            className="animate-fade-up lg:order-2"
          >
            <ParticipantList
              members={members}
              onlineUsers={onlineUsers}
              ownerId={ownerId}
              currentUserId={user?._id}
            />
          </aside>

          <div className="space-y-5 lg:order-1 lg:col-span-2">
            {panels.map((panel, i) =>
              panel.key === "whiteboard" ? (
                <Whiteboard key={panel.key}
                roomId={id} />
              ) : (
                <PlaceholderPanel
                  key={panel.key}
                  panel={panel}
                  delay={60 + i * 80}
                />
              )
            )}
          </div>
        </div>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </Layout>
  );
}

export default Room;
