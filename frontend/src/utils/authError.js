import { API_URL } from "../services/api";

/**
 * Turns whatever `auth.login` / `auth.register` threw into a banner the user
 * can act on.
 *
 * The important case is the friendly one: the auth endpoints are still being
 * built (backend/server.js only mounts /api/auth when routes/authRoutes.js
 * exists), so a missing endpoint (404) or an unreachable server (ApiError
 * status 0) must read as "not wired up yet" — never as "wrong password", and
 * never as a crash.
 *
 * @param {unknown} error  The thrown value.
 * @param {"login"|"register"} mode
 * @returns {{ tone: "warning"|"error", title: string, message: string }}
 */
export function describeAuthError(error, mode) {
  const status = error?.status;
  const serverMessage = typeof error?.message === "string" ? error.message : "";

  // --- Backend not ready -------------------------------------------------
  if (status === 0) {
    return {
      tone: "warning",
      title: "Authentication backend not connected yet",
      message: `Couldn't reach the server at ${API_URL}. Start the backend and try again — nothing was submitted.`,
    };
  }

  if (status === 404) {
    return {
      tone: "warning",
      title: "Authentication backend not connected yet",
      message: `The /auth/${mode} endpoint isn't available on the server yet. Your details were not submitted.`,
    };
  }

  // --- Real auth failures ------------------------------------------------
  if (mode === "login" && (status === 400 || status === 401 || status === 403)) {
    return {
      tone: "error",
      title: "Incorrect email or password",
      message: "Double-check your details and try again.",
    };
  }

  if (mode === "register" && status === 409) {
    return {
      tone: "error",
      title: "That email is already registered",
      message: "Try signing in instead, or use a different email address.",
    };
  }

  if (mode === "register" && (status === 400 || status === 422)) {
    return {
      tone: "error",
      title: "Please check your details",
      message: serverMessage || "The server rejected these values.",
    };
  }

  if (status === 429) {
    return {
      tone: "error",
      title: "Too many attempts",
      message: "Please wait a moment before trying again.",
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      tone: "error",
      title: "The server ran into a problem",
      message: "This one's on us. Please try again in a moment.",
    };
  }

  // --- Anything else (including non-ApiError throws) ----------------------
  return {
    tone: "error",
    title: mode === "login" ? "Could not sign you in" : "Could not create your account",
    message: serverMessage || "Something went wrong. Please try again.",
  };
}

/**
 * Guard for a server that answers 2xx but hands back no token (a stubbed
 * endpoint). We refuse to pretend the user is signed in.
 */
export const missingTokenError = (mode) =>
  mode === "login"
    ? {
        tone: "warning",
        title: "Authentication backend not connected yet",
        message:
          "The server responded, but didn't return a session token — so you're not signed in.",
      }
    : {
        tone: "warning",
        title: "Account request sent, but no session was created",
        message:
          "The server didn't return a session token. Try signing in once the auth endpoints are finished.",
      };
