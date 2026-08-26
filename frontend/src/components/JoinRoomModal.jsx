import { useState } from "react";

import Alert from "./Alert";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import { rooms as roomsApi } from "../services/api";
import { describeRoomError } from "../utils/roomError";
import { ROOM_CODE_LENGTH, validateRoomCode } from "../utils/validation";

const keyIcon = (
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
    <path d="m15.5 7.5 5-5" />
    <path d="m18 5 2 2" />
    <path d="m14 9 2 2" />
    <circle cx="8.5" cy="15.5" r="5.5" />
  </svg>
);

/**
 * Join by room code.
 *
 * A wrong code (404) is a field-level problem — it stays on the input where the
 * fix is. Anything else (server down, 5xx, expired session) is a banner,
 * because retyping the code will not help.
 */
function JoinRoomModal({ open, onClose, onJoined }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);

  // Codes are displayed uppercase everywhere; the backend matches either case.
  function normalise(value) {
    return value.replace(/\s+/g, "").toUpperCase().slice(0, ROOM_CODE_LENGTH);
  }

  function handleChange(event) {
    const next = normalise(event.target.value);
    setCode(next);
    if (touched) setError(validateRoomCode(next));
    setBanner(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const nextError = validateRoomCode(code);
    setError(nextError);
    setTouched(true);
    if (nextError) return;

    setBanner(null);
    setBusy(true);

    try {
      const data = await roomsApi.join(code);
      setBusy(false);
      onJoined?.(data?.room ?? null, data?.message || "Joined room");
    } catch (caught) {
      setBusy(false);

      if (caught?.status === 404) {
        setError("No room found with that code.");
        return;
      }

      setBanner(describeRoomError(caught, "join"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title="Join a room"
      description="Enter the 6-character code someone shared with you."
      icon={keyIcon}
    >
      {banner && (
        <Alert tone={banner.tone} title={banner.title} className="mb-4">
          {banner.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Room code"
          name="roomCode"
          value={code}
          onChange={handleChange}
          onBlur={() => {
            setTouched(true);
            setError(validateRoomCode(code));
          }}
          error={touched ? error : ""}
          helperText="Case-insensitive — 8VNEK7 and 8vnek7 both work."
          placeholder="8VNEK7"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          maxLength={ROOM_CODE_LENGTH}
          disabled={busy}
          className="text-center font-mono text-lg tracking-[0.36em] uppercase"
          required
        />

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={busy}>
            {busy ? "Joining…" : "Join room"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default JoinRoomModal;
