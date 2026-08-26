import CreateRoomModal from "./CreateRoomModal";
import JoinRoomModal from "./JoinRoomModal";
import LeaveRoomDialog from "./LeaveRoomDialog";

/**
 * Renders the three room dialogs from a `useRoomDialogs()` bundle, so a page
 * only has to spread it: `<RoomDialogs {...dialogs} currentUserId={id} />`.
 *
 * Each dialog is mounted only while it is open — that is what resets its form
 * between uses, so none of them needs to clear its own state.
 */
function RoomDialogs({
  createOpen,
  joinOpen,
  leaveTarget,
  closeCreate,
  closeJoin,
  cancelLeave,
  handleCreated,
  handleJoined,
  handleLeft,
  currentUserId,
}) {
  return (
    <>
      {createOpen && (
        <CreateRoomModal open onClose={closeCreate} onCreated={handleCreated} />
      )}

      {joinOpen && (
        <JoinRoomModal open onClose={closeJoin} onJoined={handleJoined} />
      )}

      {leaveTarget && (
        <LeaveRoomDialog
          open
          room={leaveTarget}
          currentUserId={currentUserId}
          onClose={cancelLeave}
          onLeft={handleLeft}
        />
      )}
    </>
  );
}

export default RoomDialogs;
