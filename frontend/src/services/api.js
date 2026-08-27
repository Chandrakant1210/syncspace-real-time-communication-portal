/**
 * Thin fetch wrapper around the SyncSpace backend.
 *
 * Base URL comes from VITE_API_URL when set, otherwise the backend's default
 * dev port (5000 — see backend/.env.example). Every request automatically
 * carries `Authorization: Bearer <token>` when a token is in localStorage.
 */

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

const TOKEN_KEY = "syncspace_token";
const USER_KEY = "syncspace_user";

/* ---------------- Token storage ---------------- */

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // Private mode / storage disabled.
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore — the app still works for the current session */
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

/** Clears the saved session (used on logout and on a 401). */
export function clearSession() {
  setToken(null);
  setStoredUser(null);
}

/* ---------------- Core request ---------------- */

/** Error thrown for any non-2xx response, carrying the HTTP status. */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * @param {string} path      Path after /api, e.g. "/rooms" or "/rooms/join"
 * @param {object} [options] { method, body, headers, auth }
 *                           `body` is JSON-encoded automatically.
 *                           `auth: false` skips the Bearer header.
 */
export async function request(path, options = {}) {
  const { method = "GET", body, headers = {}, auth = true, ...rest } = options;

  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

  const token = auth ? getToken() : null;
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...rest,
    });
  } catch {
    // Network-level failure: server down, DNS, CORS preflight rejected.
    throw new ApiError("Cannot reach the server", 0, null);
  }

  // 204 and empty bodies have nothing to parse.
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(
      data?.message || `Request failed (${response.status})`,
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

/* ---------------- Health ---------------- */

/**
 * Backend connection check -> { status: "ok", db: "connected", uptime }
 * Used by the Home page banner.
 */
export function checkBackend() {
  return api.get("/health", { auth: false });
}

/* ---------------- Auth (implemented by Chandrakant) ---------------- */

/** Both endpoints resolve to { token, user }; the session is stored on success. */
export const auth = {
  async register(payload) {
    const data = await api.post("/auth/register", payload, { auth: false });
    if (data?.token) setToken(data.token);
    if (data?.user) setStoredUser(data.user);
    return data;
  },

  async login(payload) {
    const data = await api.post("/auth/login", payload, { auth: false });
    if (data?.token) setToken(data.token);
    if (data?.user) setStoredUser(data.user);
    return data;
  },

  logout() {
    clearSession();
  },

  isLoggedIn() {
    return Boolean(getToken());
  },
};

/* ---------------- Rooms ---------------- */

export const rooms = {
  create: ({ name, description }) => api.post("/rooms", { name, description }),
  myRooms: () => api.get("/rooms"),
  join: (roomCode) => api.post("/rooms/join", { roomCode }),
  leave: (roomId) => api.post(`/rooms/${roomId}/leave`),
};

/* ---------------- Code Execution ---------------- */

export const codeExecution = {
  run: ({ language, code, stdin = "" }) =>
    api.post("/code/run", {
      language,
      code,
      stdin,
    }),
};

export { API_URL };
export default api;
