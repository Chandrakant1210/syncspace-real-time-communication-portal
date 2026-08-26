import { API_URL } from "../services/api";

/**
 * Turns a thrown ApiError from any rooms.* call into a banner the user can act
 * on. Mirrors utils/authError.js, but for the room endpoints documented in
 * backend/docs/API_LIST.md.
 *
 * The cases that matter are kept distinct on purpose:
 *   - server unreachable (status 0)  -> "start the backend"
 *   - expired/invalid session (401)  -> "sign in again"
 *   - unknown room code (404 on join) -> a field-level problem, not a failure
 *   - 5xx                            -> "on us, try again"
 *
 * @param {unknown} error
 * @param {"load"|"create"|"join"|"leave"} action
 * @returns {{ tone: "error"|"warning", title: string, message: string }}
 */
export function describeRoomError(error, action = "load") {
  const status = error?.status;
  const serverMessage = typeof error?.message === "string" ? error.message : "";

  if (status === 0) {
    return {
      tone: "warning",
      title: "Cannot reach the server",
      message: `No response from ${API_URL}. Start the backend and try again — nothing was changed.`,
    };
  }

  if (status === 401) {
    return {
      tone: "warning",
      title: "Your session has expired",
      message: "Sign in again to continue working with your rooms.",
    };
  }

  if (action === "join" && status === 404) {
    return {
      tone: "error",
      title: "No room found with that code",
      message:
        "Double-check the 6-character code with whoever shared it — codes are case-insensitive.",
    };
  }

  if (status === 404) {
    return {
      tone: "error",
      title: "Room not found",
      message: "It may have been deleted, or you are no longer a member.",
    };
  }

  if (status === 400 || status === 422) {
    return {
      tone: "error",
      title: "That did not work",
      message: serverMessage || "The server rejected these values.",
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      tone: "error",
      title: "The server ran into a problem",
      message: "This one is on us. Please try again in a moment.",
    };
  }

  const fallbackTitles = {
    load: "Could not load your rooms",
    create: "Could not create the room",
    join: "Could not join that room",
    leave: "Could not leave the room",
  };

  return {
    tone: "error",
    title: fallbackTitles[action] || "Something went wrong",
    message: serverMessage || "Please try again.",
  };
}

export default describeRoomError;
