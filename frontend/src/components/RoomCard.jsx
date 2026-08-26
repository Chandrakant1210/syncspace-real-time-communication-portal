import { Link } from "react-router-dom";

import CopyButton from "./CopyButton";
import { avatarTint, getInitials } from "../utils/initials";

/** Populated `owner` / `members` are objects; fall back to raw id strings. */
function idOf(person) {
  if (!person) return "";
  return String(typeof person === "object" ? person._id : person);
}

function nameOf(person) {
  if (!person) return "Unknown";
  return typeof person === "object" ? person.name || person.email || "Unknown" : "Member";
}

/**
 * One room in the grid.
 *
 * The whole tile is a link into /room/:id (stretched over the card), so the
 * actions that must NOT navigate — copy, leave — sit above it on the stacking
 * order and stop their own events.
 */
function RoomCard({ room, currentUserId, onLeave, style }) {
  const members = Array.isArray(room.members) ? room.members : [];
  const ownerId = idOf(room.owner);
  const isOwner = Boolean(currentUserId) && ownerId === String(currentUserId);
  const memberCount = members.length;

  return (
    <article
      style={style}
      className="animate-fade-up group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lift focus-within:border-indigo-300"
    >
      {/* Stretched link — the card itself is the primary target. */}
      <Link
        to={`/room/${room._id}`}
        className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <span className="sr-only">Enter {room.name}</span>
      </Link>

      {/* ---- Header ---- */}
      <div className="relative z-10 flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-sm font-semibold text-white shadow-soft transition-transform duration-300 group-hover:scale-105 ${avatarTint(
            room._id
          )}`}
        >
          {getInitials(room.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-slate-900">
              {room.name}
            </h3>

            {isOwner && (
              <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-100">
                Owner
              </span>
            )}
          </div>

          <p
            className={`mt-1 text-xs leading-relaxed ${
              room.description ? "line-clamp-2 text-slate-500" : "italic text-slate-400"
            }`}
          >
            {room.description || "No description"}
          </p>
        </div>
      </div>

      {/* ---- Members + code ---- */}
      <div className="relative z-10 mt-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex -space-x-1.5">
            {members.slice(0, 3).map((member, i) => (
              <span
                key={idOf(member) || i}
                title={nameOf(member)}
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br text-[9px] font-semibold text-white ring-2 ring-white ${avatarTint(
                  idOf(member) || i
                )}`}
              >
                {getInitials(nameOf(member))}
              </span>
            ))}
            {memberCount > 3 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600 ring-2 ring-white">
                +{memberCount - 3}
              </span>
            )}
          </span>

          <span className="truncate text-xs text-slate-500">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        <CopyButton value={room.roomCode} label={`Copy code for ${room.name}`} />
      </div>

      {/* ---- Actions ---- */}
      <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <Link
          to={`/room/${room._id}`}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-3 text-[13px] font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-px hover:from-indigo-500 hover:to-violet-500 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Enter
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
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onLeave?.(room); // opens the confirm dialog, which owns the request
          }}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[13px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Leave
        </button>
      </div>
    </article>
  );
}

/** Matches the card's silhouette so the grid does not jump when data lands. */
export function RoomCardSkeleton({ style }) {
  return (
    <div
      style={style}
      aria-hidden="true"
      className="animate-fade-in rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-100" />
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default RoomCard;
