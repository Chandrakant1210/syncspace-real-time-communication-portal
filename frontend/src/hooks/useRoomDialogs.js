import { useCallback, useState } from "react";

/**
 * Open/close state and post-action bookkeeping for the create / join / leave
 * dialogs. The dashboard strip and the /rooms page drive the same three
 * dialogs, so the wiring lives here and the pages only render <RoomDialogs>.
 *
 * @param {{ reload: (opts?: object) => Promise<unknown>,
 *           onNotice?: (notice: object|null) => void }} options
 */
export default function useRoomDialogs({ reload, onNotice }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState(null);

  const notify = useCallback((notice) => onNotice?.(notice), [onNotice]);

  const openCreate = useCallback(() => {
    notify(null);
    setCreateOpen(true);
  }, [notify]);

  const openJoin = useCallback(() => {
    notify(null);
    setJoinOpen(true);
  }, [notify]);

  const requestLeave = useCallback(
    (room) => {
      notify(null);
      setLeaveTarget(room);
    },
    [notify]
  );

  /* The create dialog stays open on success to show the room code — refresh
     the list underneath it so it is current the moment the dialog closes. */
  const handleCreated = useCallback(() => {
    reload({ silent: true });
  }, [reload]);

  const handleJoined = useCallback(
    async (room, message) => {
      setJoinOpen(false);
      await reload({ silent: true });

      const already = /already a member/i.test(String(message || ""));
      notify({
        tone: already ? "info" : "success",
        title: already
          ? `You are already in “${room?.name ?? "that room"}”`
          : `Joined “${room?.name ?? "the room"}”`,
        message: already
          ? "It was already in your list — open it from the grid below."
          : "It has been added to your rooms.",
      });
    },
    [notify, reload]
  );

  const handleLeft = useCallback(
    async (room, result) => {
      setLeaveTarget(null);
      await reload({ silent: true });

      notify({
        tone: "success",
        title: result?.roomDeleted
          ? `“${room.name}” was deleted`
          : `You left “${room.name}”`,
        message: result?.roomDeleted
          ? "You were the last member, so the room and its code are gone."
          : "You will need the room code to rejoin.",
      });
    },
    [notify, reload]
  );

  return {
    createOpen,
    joinOpen,
    leaveTarget,
    openCreate,
    openJoin,
    requestLeave,
    closeCreate: () => setCreateOpen(false),
    closeJoin: () => setJoinOpen(false),
    cancelLeave: () => setLeaveTarget(null),
    handleCreated,
    handleJoined,
    handleLeft,
  };
}
