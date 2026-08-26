import { useEffect, useRef, useState } from "react";

import socket, { connectSocket, disconnectSocket } from "../services/socket";

/** The same person can hold two sockets (two tabs) — presence is per person. */
function dedupeByUser(users) {
  if (!Array.isArray(users)) return [];

  const seen = new Map();
  users.forEach((entry) => {
    const userId = String(entry?.userId ?? "");
    if (!userId || seen.has(userId)) return;
    seen.set(userId, { userId, name: entry.name || "Someone" });
  });

  return Array.from(seen.values());
}

/**
 * Presence for one collaboration room, over the events in
 * backend/docs/API_LIST.md §4.
 *
 * Lifecycle: connect -> `room:join` -> (`room:joined` | `user:joined` |
 * `user:left` keep the roster fresh) -> `room:leave` + disconnect on unmount.
 * The join is re-emitted on every `connect`, so a dropped connection restores
 * presence by itself; a closed tab is cleaned up server-side by `disconnect`.
 *
 * @param {{ roomId?: string, userId?: string, userName?: string,
 *           onUserJoined?: Function, onUserLeft?: Function }} options
 */
export default function useRoomPresence({
  roomId,
  userId,
  userName,
  onUserJoined,
  onUserLeft,
}) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connection, setConnection] = useState("connecting");
  const [detail, setDetail] = useState("");

  // Keep the callbacks current without re-subscribing on every render. Written
  // in an effect rather than during render — refs are not render-safe.
  const joinedRef = useRef(onUserJoined);
  const leftRef = useRef(onUserLeft);

  useEffect(() => {
    joinedRef.current = onUserJoined;
    leftRef.current = onUserLeft;
  }, [onUserJoined, onUserLeft]);

  useEffect(() => {
    if (!roomId || !userId) return undefined;

    const payload = { roomId, userId, name: userName || "Someone" };
    let hasConnected = false;
    let flashTimer = null;

    function join() {
      socket.emit("room:join", payload);
    }

    function handleConnect() {
      setDetail("");

      if (hasConnected) {
        // Brief confirmation, then back to no chrome at all.
        setConnection("reconnected");
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => setConnection("connected"), 2500);
      } else {
        setConnection("connected");
      }

      hasConnected = true;
      join();
    }

    function handleDisconnect(reason) {
      clearTimeout(flashTimer);
      setOnlineUsers([]);
      // An intentional close (unmount, logout) is not worth a banner.
      if (reason === "io client disconnect") return;
      setConnection("reconnecting");
    }

    function handleConnectError() {
      clearTimeout(flashTimer);
      setConnection(hasConnected ? "reconnecting" : "error");
    }

    function handleAuthError(data) {
      setConnection("error");
      setDetail(
        data?.message
          ? `Live session refused the session token: ${data.message}`
          : "Live session refused the session token — sign in again."
      );
    }

    function handleRoomJoined(data) {
      if (data?.roomId && data.roomId !== roomId) return;
      setOnlineUsers(dedupeByUser(data?.users));
    }

    function handleUserJoined(data) {
      setOnlineUsers(dedupeByUser(data?.users));
      if (data?.userId && String(data.userId) !== String(userId)) {
        joinedRef.current?.(data);
      }
    }

    function handleUserLeft(data) {
      setOnlineUsers(dedupeByUser(data?.users));
      if (data?.userId && String(data.userId) !== String(userId)) {
        leftRef.current?.(data);
      }
    }

    function handleRoomError(data) {
      setConnection("error");
      setDetail(data?.message || "The live session rejected this room.");
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("auth:error", handleAuthError);
    socket.on("room:joined", handleRoomJoined);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);
    socket.on("room:error", handleRoomError);

    connectSocket();

    // Already connected from a previous visit: `connect` will not fire again,
    // so mirror what its handler would have done. The state update is queued
    // rather than run inline — an effect body must not set state synchronously.
    if (socket.connected) {
      hasConnected = true;
      join();
      queueMicrotask(() => setConnection("connected"));
    }

    return () => {
      clearTimeout(flashTimer);
      if (socket.connected) socket.emit("room:leave", { roomId });

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("auth:error", handleAuthError);
      socket.off("room:joined", handleRoomJoined);
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
      socket.off("room:error", handleRoomError);

      // Only the room page needs a socket — leaving the page closes it, which
      // also covers a tab close (the server broadcasts `user:left` on disconnect).
      disconnectSocket();
    };
  }, [roomId, userId, userName]);

  return { onlineUsers, connection, detail };
}
