import { io } from "socket.io-client";

import { API_URL, getToken } from "./api";

/**
 * Socket.IO client for room presence (see backend/docs/API_LIST.md §4).
 *
 * The socket server shares the backend's HTTP port, so the URL is API_URL with
 * the trailing "/api" removed unless VITE_SOCKET_URL says otherwise.
 *
 * `autoConnect: false` on purpose: only the collaboration room needs a live
 * connection, and connecting on import would have every page retrying against
 * a stopped backend. `auth` is a callback so the *current* token is sent on
 * every reconnect, not the one that happened to exist at import time.
 */
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, "") ||
  API_URL.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
});

/** Opens the connection if it is not already up. Safe to call repeatedly. */
export function connectSocket() {
  if (!socket.connected) socket.connect(); // no-op while a connect is in flight
  return socket;
}

/** Closes the connection — the server broadcasts `user:left` for every room. */
export function disconnectSocket() {
  if (socket.connected || socket.active) socket.disconnect();
}

export { SOCKET_URL };
export default socket;
