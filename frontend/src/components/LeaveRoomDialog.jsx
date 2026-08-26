import { useState } from "react";

import Alert from "./Alert";
import Button from "./Button";
import Modal from "./Modal";
import { rooms as roomsApi } from "../services/api";
import { describeRoomError } from "../utils/roomError";

const exitIcon = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

function idOf(person) {
  if (!person) return "";
  return String(typeof person === "object" ? person._id : person);
}

/**
 * Confirmation for POST /api/rooms/:id/leave.
 *
 * Both server-side consequences are spelled out every time (ownership transfer,
 * deletion of an empty room) with the one that actually applies to this user
 * called out — leaving is not reversible and the room code is not recoverable.
 */
function LeaveRoomDialog({ open, room, currentUserId, onClose, onLeft }) {
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!room) return null;

  const memberCount = Array.isArray(room.members) ? room.members.length : 0;
  const isOwner = Boolean(currentUserId) && idOf(room.owner) === String(currentUserId);
  const isLastMember = memberCount <= 1;

  async function handleLeave() {
    if (busy) return;
    setBanner(null);
    setBusy(true);

    try {
      const data = await roomsApi.leave(room._id);
      setBusy(false);
      onLeft?.(room, data);
    } catch (caught) {
      setBanner(describeRoomError(caught, "leave"));
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      size="md"
      title={`Leave “${room.name}”?`}
      description="You will need the room code to get back in."
      icon={exitIcon}
    >
      {banner && (
        <Alert tone={banner.tone} title={banner.title} className="mb-4">
          {banner.message}
        </Alert>
      )}

      {/* The consequence that applies to this user, stated plainly. */}
      {isLastMember ? (
        <Alert tone="warning" title="You are the last member">
          Leaving deletes this room permanently, along with its code. This cannot
          be undone.
        </Alert>
      ) : isOwner ? (
        <Alert tone="warning" title="You own this room">
          Ownership transfers to the next member as soon as you leave. You will
          not get it back by rejoining.
        </Alert>
      ) : (
        <Alert tone="info" title="You will be removed from this room">
          The other {memberCount - 1}{" "}
          {memberCount - 1 === 1 ? "member keeps" : "members keep"} access.
        </Alert>
      )}

      {/* Both rules, so the behaviour is never a surprise later. */}
      <ul className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
          If the owner leaves and members remain, ownership passes to the next
          member.
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
          If the last member leaves, the room is deleted.
        </li>
      </ul>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" size="md" onClick={onClose} disabled={busy}>
          Stay in room
        </Button>
        <Button variant="danger" size="md" onClick={handleLeave} loading={busy}>
          {busy ? "Leaving…" : isLastMember ? "Leave and delete" : "Leave room"}
        </Button>
      </div>
    </Modal>
  );
}

export default LeaveRoomDialog;
