import { useState } from "react";
import { Link } from "react-router-dom";

import Alert from "./Alert";
import Button from "./Button";
import CopyButton from "./CopyButton";
import Input from "./Input";
import Modal from "./Modal";
import Textarea from "./Textarea";
import { rooms as roomsApi } from "../services/api";
import { describeRoomError } from "../utils/roomError";
import {
  ROOM_DESCRIPTION_MAX,
  ROOM_NAME_MAX,
  isFormValid,
  validateRoomDescription,
  validateRoomName,
} from "../utils/validation";

const blankValues = { name: "", description: "" };
const blankErrors = { name: "", description: "" };

const plusIcon = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className="h-5 w-5"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

/**
 * Create a room, then hand back the generated code.
 *
 * Mounted only while open (see RoomDialogs), so its state resets on each use.
 *
 * The success view stays open deliberately: the room code is the only way for
 * anyone else to join, and it is never shown again this prominently. The list
 * behind the dialog is already refreshed by then.
 */
function CreateRoomModal({ open, onClose, onCreated }) {
  const [values, setValues] = useState(blankValues);
  const [errors, setErrors] = useState(blankErrors);
  const [touched, setTouched] = useState({ name: false, description: false });
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const validators = {
    name: validateRoomName,
    description: validateRoomDescription,
  };

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validators[name](value) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const nextErrors = {
      name: validateRoomName(values.name),
      description: validateRoomDescription(values.description),
    };
    setErrors(nextErrors);
    setTouched({ name: true, description: true });
    if (!isFormValid(nextErrors)) return;

    setBanner(null);
    setBusy(true);

    try {
      const data = await roomsApi.create({
        name: values.name.trim(),
        description: values.description.trim(),
      });

      setCreated(data?.room ?? null);
      setBusy(false);
      onCreated?.(data?.room ?? null); // refreshes the list behind the dialog
    } catch (caught) {
      setBanner(describeRoomError(caught, "create"));
      setBusy(false);
    }
  }

  /* ---------------- Success ---------------- */
  if (created) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Room created"
        description={`"${created.name}" is ready. Share the code below so your team can join.`}
        icon={
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        }
      >
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-violet-50 p-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
            Share this code
          </p>

          <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.32em] text-indigo-950 sm:text-4xl">
            {created.roomCode}
          </p>

          <div className="mt-4 flex justify-center">
            <CopyButton
              value={created.roomCode}
              label="Copy the new room code"
              className="h-9! px-3! text-[13px]!"
            />
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
          Anyone with this code can join from the “Join Room” dialog. You can
          copy it again any time from the room card.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
          <Link
            to={`/room/${created._id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-px hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Enter room
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </Modal>
    );
  }

  /* ---------------- Form ---------------- */
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title="Create a room"
      description="Give it a name — we generate a shareable code for you."
      icon={plusIcon}
    >
      {banner && (
        <Alert tone={banner.tone} title={banner.title} className="mb-4">
          {banner.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Room name"
          name="name"
          placeholder="Design Sync"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name ? errors.name : ""}
          helperText={`Up to ${ROOM_NAME_MAX} characters.`}
          maxLength={ROOM_NAME_MAX}
          disabled={busy}
          autoComplete="off"
          required
        />

        <Textarea
          label="Description"
          name="description"
          placeholder="Weekly UI review — optional, but it helps your team recognise the room."
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.description ? errors.description : ""}
          helperText={`Optional · ${values.description.trim().length}/${ROOM_DESCRIPTION_MAX}`}
          maxLength={ROOM_DESCRIPTION_MAX}
          disabled={busy}
          rows={3}
        />

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={busy}>
            {busy ? "Creating…" : "Create room"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateRoomModal;
