import { useState } from "react";

import { avatarTint, getInitials } from "../utils/initials";

function idOf(person) {
  if (!person) return "";
  return String(typeof person === "object" ? person._id : person);
}

/**
 * Room roster: everyone on the membership list, with a live dot driven by
 * socket presence.
 *
 * Presence can contain someone the membership list does not — a member who
 * joined in another tab between our fetch and now — so the two sources are
 * merged rather than filtered against each other.
 */
function ParticipantList({ members = [], onlineUsers = [], ownerId, currentUserId }) {
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const onlineIds = new Set(onlineUsers.map((user) => String(user.userId)));
  const memberIds = new Set(members.map(idOf));

  const roster = [
    ...members.map((member) => ({
      id: idOf(member),
      name: typeof member === "object" ? member.name || member.email : "Member",
      email: typeof member === "object" ? member.email : "",
      online: onlineIds.has(idOf(member)),
      isMember: true,
    })),
    // Present but not on the membership list we fetched.
    ...onlineUsers
      .filter((user) => !memberIds.has(String(user.userId)))
      .map((user) => ({
        id: String(user.userId),
        name: user.name || "Someone",
        email: "",
        online: true,
        isMember: false,
      })),
  ].sort((a, b) => {
    if (a.id === String(currentUserId)) return -1;
    if (b.id === String(currentUserId)) return 1;
    if (a.online !== b.online) return a.online ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });

  const onlineCount = roster.filter((person) => person.online).length;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-soft">
      {/* On mobile the header is the disclosure control; on lg+ it is a heading. */}
      <button
        type="button"
        onClick={() => setOpenOnMobile((v) => !v)}
        aria-expanded={openOnMobile}
        aria-controls="participant-list"
        className="flex w-full items-center justify-between gap-2 rounded-t-2xl px-4 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:pointer-events-none lg:hover:bg-transparent"
      >
        <span className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Participants</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {roster.length}
          </span>
        </span>

        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              {onlineCount > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  onlineCount > 0 ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </span>
            {onlineCount} online
          </span>

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 lg:hidden ${
              openOnMobile ? "rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <ul
        id="participant-list"
        className={`border-t border-slate-100 p-2 ${openOnMobile ? "block" : "hidden"} lg:block`}
      >
        {roster.length === 0 && (
          <li className="px-2 py-4 text-center text-xs text-slate-500">
            No members yet.
          </li>
        )}

        {roster.map((person) => {
          const isYou = person.id === String(currentUserId);
          const isOwner = Boolean(ownerId) && person.id === String(ownerId);

          return (
            <li
              key={person.id}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
            >
              <span className="relative shrink-0">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-[11px] font-semibold text-white ${avatarTint(
                    person.id
                  )} ${person.online ? "" : "opacity-45 saturate-50"}`}
                >
                  {getInitials(person.name)}
                </span>
                <span
                  title={person.online ? "Online" : "Offline"}
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                    person.online ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`truncate text-[13px] font-medium ${
                      person.online ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {person.name}
                  </span>
                  {isYou && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-600">
                      You
                    </span>
                  )}
                  {isOwner && (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-1.5 py-px text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                      Owner
                    </span>
                  )}
                </span>

                <span className="block truncate text-[11px] text-slate-400">
                  {person.online ? "Online now" : person.email || "Offline"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ParticipantList;
