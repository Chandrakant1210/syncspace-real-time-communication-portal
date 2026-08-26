import Button from "./Button";
import RoomCard, { RoomCardSkeleton } from "./RoomCard";

/**
 * The four states of a room grid — loading, error, empty, populated — kept in
 * one place so the dashboard strip and the /rooms page cannot drift apart.
 */
function RoomList({
  rooms = [],
  status = "ready",
  error,
  onRetry,
  currentUserId,
  onLeave,
  onCreate,
  onJoin,
  skeletonCount = 3,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}) {
  const gridClasses = `grid grid-cols-1 gap-4 ${columns}`;

  /* ---- Loading ---- */
  if (status === "loading") {
    return (
      <div className={gridClasses}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <RoomCardSkeleton key={i} style={{ animationDelay: `${i * 70}ms` }} />
        ))}
        <span className="sr-only" role="status">
          Loading your rooms
        </span>
      </div>
    );
  }

  /* ---- Error ---- */
  if (status === "error") {
    return (
      <div
        role="alert"
        className="animate-fade-up flex flex-col items-center rounded-2xl border border-red-200/80 bg-red-50/60 px-5 py-8 text-center"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-red-600 shadow-soft ring-1 ring-inset ring-red-100">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </span>

        <p className="mt-3 text-sm font-semibold text-red-900">
          {error?.title || "Could not load your rooms"}
        </p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-red-700">
          {error?.message || "Please try again."}
        </p>

        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
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
            <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Try again
        </Button>
      </div>
    );
  }

  /* ---- Empty ---- */
  if (rooms.length === 0) {
    return (
      <div className="animate-fade-up flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-50 to-violet-50 text-indigo-500 ring-1 ring-inset ring-indigo-100">
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
            <path d="m22 8-6 4 6 4V8Z" />
            <rect x="2" y="6" width="14" height="12" rx="2.5" />
          </svg>
        </span>

        <p className="mt-3 text-sm font-semibold text-slate-900">
          No rooms yet — create your first
        </p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
          A room is where your team meets: share the 6-character code and
          everyone lands in the same space.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" size="md" onClick={onCreate}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              className="h-4 w-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Room
          </Button>

          {onJoin && (
            <Button variant="secondary" size="md" onClick={onJoin}>
              Join with a code
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ---- Populated ---- */
  return (
    <div className={gridClasses}>
      {rooms.map((room, i) => (
        <RoomCard
          key={room._id}
          room={room}
          currentUserId={currentUserId}
          onLeave={onLeave}
          style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
        />
      ))}
    </div>
  );
}

export default RoomList;
