import { useCallback, useState } from "react";

import Alert from "../components/Alert";
import Button from "../components/Button";
import Layout from "../components/Layout";
import RoomDialogs from "../components/RoomDialogs";
import RoomList from "../components/RoomList";
import useRoomDialogs from "../hooks/useRoomDialogs";
import useRooms from "../hooks/useRooms";
import { getStoredUser } from "../services/api";

function Rooms() {
  const currentUserId = getStoredUser()?._id;
  const { rooms, status, error, reload } = useRooms();

  const [notice, setNotice] = useState(null);
  const handleNotice = useCallback((next) => setNotice(next), []);
  const dialogs = useRoomDialogs({ reload, onNotice: handleNotice });

  const ownedCount = rooms.filter(
    (room) => String(room.owner?._id ?? room.owner) === String(currentUserId)
  ).length;

  return (
    <Layout>
      {/* ---------------- Header ---------------- */}
      <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            My Rooms
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {status === "ready"
              ? rooms.length === 0
                ? "You are not a member of any room yet."
                : `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}${
                    ownedCount > 0 ? ` · you own ${ownedCount}` : ""
                  }`
              : "Every room you are a member of."}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" onClick={dialogs.openJoin}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m15.5 7.5 5-5" />
              <path d="m18 5 2 2" />
              <circle cx="8.5" cy="15.5" r="5.5" />
            </svg>
            Join with code
          </Button>

          <Button variant="primary" size="md" onClick={dialogs.openCreate}>
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
            New Room
          </Button>
        </div>
      </header>

      {notice && (
        <Alert tone={notice.tone} title={notice.title} className="mt-5">
          {notice.message}
        </Alert>
      )}

      {/* ---------------- Grid ---------------- */}
      <div className="mt-5">
        <RoomList
          rooms={rooms}
          status={status}
          error={error}
          onRetry={() => reload()}
          currentUserId={currentUserId}
          onLeave={dialogs.requestLeave}
          onCreate={dialogs.openCreate}
          onJoin={dialogs.openJoin}
          skeletonCount={6}
        />
      </div>

      <RoomDialogs {...dialogs} currentUserId={currentUserId} />
    </Layout>
  );
}

export default Rooms;
