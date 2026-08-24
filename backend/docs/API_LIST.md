# SyncSpace — API List

Base URL (development): `http://localhost:5000/api`
All requests and responses are JSON.

**Ownership**

| Area | Owner | Status |
| --- | --- | --- |
| Auth (`/api/auth/*`), `config/db.js`, `models/User.js` | Chandrakant | implemented by Chandrakant |
| Backend structure, rooms, middleware, health, integration | Sargun | done |
| Whiteboard sync, code execution | both | to be implemented 25–26 Aug |

**Error format** — every failure from the backend uses the same envelope, produced by
`middleware/errorHandler.js`:

```json
{ "success": false, "message": "Not authorized: token expired" }
```

**Auth header** — every room endpoint requires:

```
Authorization: Bearer <token>
```

Missing, malformed, invalid, or expired tokens return `401` with the envelope above.

---

## 1. Health

### GET /api/health

Liveness probe. No auth. Used by the frontend's "backend connection" check.

| | |
| --- | --- |
| Headers | none |
| Body | none |

**200 OK**

```json
{ "status": "ok", "db": "connected", "uptime": 42 }
```

`db` is the Mongoose connection state: `connected`, `connecting`, `disconnecting`,
`disconnected`, or `unknown`.

---

## 2. Auth — *implemented by Chandrakant*

The agreed contract. Both endpoints resolve to `{ token, user }`; the frontend stores the
token in `localStorage` and `services/api.js` attaches it to later requests automatically.
The JWT is signed with `process.env.JWT_SECRET` and must carry the user id in the payload
as `id` (`_id`, `userId`, and `sub` are also accepted by `middleware/auth.js`).

### POST /api/auth/register

| | |
| --- | --- |
| Headers | `Content-Type: application/json` |

**Body**

```json
{ "name": "Sargun", "email": "sargun@example.com", "password": "secret123" }
```

**201 Created**

```json
{
  "token": "<jwt>",
  "user": { "_id": "64b7...", "name": "Sargun", "email": "sargun@example.com" }
}
```

**Errors** — `400` validation failed, `409` email already registered.

### POST /api/auth/login

| | |
| --- | --- |
| Headers | `Content-Type: application/json` |

**Body**

```json
{ "email": "sargun@example.com", "password": "secret123" }
```

**200 OK**

```json
{
  "token": "<jwt>",
  "user": { "_id": "64b7...", "name": "Sargun", "email": "sargun@example.com" }
}
```

**Errors** — `400` missing fields, `401` invalid credentials.

---

## 3. Rooms — implemented

All four endpoints sit behind `middleware/auth.js`. The caller is identified by
`req.user.id` from the token — a user id is never taken from the request body.

`owner` and `members` come back as populated objects (`_id`, `name`, `email`) once
`models/User.js` is merged; until then they are raw id strings.

### POST /api/rooms — createRoom

Creates a room. The caller becomes the owner **and** the first member. A unique
6-character `roomCode` is generated server-side (unambiguous alphabet — no `0/O/1/I/L`).

| | |
| --- | --- |
| Headers | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body**

```json
{ "name": "Design Sync", "description": "Weekly UI review" }
```

`name` is required (max 80 chars). `description` is optional (max 500 chars).

**201 Created**

```json
{
  "success": true,
  "message": "Room created",
  "room": {
    "_id": "6a8b34c7...",
    "name": "Design Sync",
    "description": "Weekly UI review",
    "owner": { "_id": "6a8b...", "name": "Alice", "email": "a@x.com" },
    "members": [{ "_id": "6a8b...", "name": "Alice", "email": "a@x.com" }],
    "roomCode": "8VNEK7",
    "createdAt": "2026-08-23T17:58:31.568Z",
    "updatedAt": "2026-08-23T17:58:31.568Z"
  }
}
```

**Errors** — `400` "Room name is required", `401` unauthorized.

### GET /api/rooms — getMyRooms

Every room the caller is a member of, most recently updated first.

| | |
| --- | --- |
| Headers | `Authorization: Bearer <token>` |
| Body | none |

**200 OK**

```json
{ "success": true, "count": 1, "rooms": [{ "...": "room object as above" }] }
```

**Errors** — `401` unauthorized.

### POST /api/rooms/join — joinRoom

Joins by room code. The code is case-insensitive (`abc123` and `ABC123` both work).
Joining a room you are already in is a success, not an error — that keeps the frontend
join button idempotent.

| | |
| --- | --- |
| Headers | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body**

```json
{ "roomCode": "8VNEK7" }
```

**200 OK**

```json
{ "success": true, "message": "Joined room", "room": { "...": "room object" } }
```

Already a member → `200` with `"message": "You are already a member of this room"`.

**Errors** — `400` "Room code is required", `404` "No room found with that code",
`401` unauthorized.

### POST /api/rooms/:id/leave — leaveRoom

Removes the caller from the room.

- If the **owner** leaves and other members remain, ownership passes to the next member.
- If the **last member** leaves, the room is deleted (`roomDeleted: true`).

| | |
| --- | --- |
| Headers | `Authorization: Bearer <token>` |
| Params | `:id` — the room's `_id` |
| Body | none |

**200 OK**

```json
{
  "success": true,
  "message": "Left room",
  "roomDeleted": false,
  "room": { "...": "room object" }
}
```

Last member leaving:

```json
{
  "success": true,
  "message": "Left room. The room was empty and has been deleted.",
  "roomDeleted": true
}
```

**Errors** — `400` "You are not a member of this room", `400` "Invalid _id: notanid",
`404` "Room not found", `401` unauthorized.

---

## 4. Sockets — connected

Socket.IO is served from the same HTTP server on port `5000`, with CORS locked to
`CLIENT_URL`. `sockets/socket.js` currently handles `connection` / `disconnect`; the `io`
instance is available to Express handlers via `req.app.get("io")`.

---

## Planned integrations — *to be implemented 25–26 Aug*

### Whiteboard sync (Socket.IO, room-scoped)

Every event carries the `roomId` so drawing stays inside one room's Socket.IO room
(`socket.join(roomId)` on entry). The server relays with `socket.to(roomId)` — the sender
already has the stroke locally, so it is never echoed back.

| Event | Direction | Payload |
| --- | --- | --- |
| `whiteboard:join` | client → server | `{ roomId }` |
| `whiteboard:draw` | client → server → room | `{ roomId, stroke: { points, color, width, tool } }` |
| `whiteboard:erase` | client → server → room | `{ roomId, strokeId }` or `{ roomId, points, width }` |
| `whiteboard:clear` | client → server → room | `{ roomId }` |
| `whiteboard:state` | server → client | `{ roomId, strokes: [] }` — sent on join so late arrivals catch up |

Membership is checked against the Room model before relaying, so only members of a room
can draw in it. Persistence (storing strokes per room) is a follow-up decision — the first
version keeps each room's canvas in memory.

### Code execution (in-browser sandboxed Web Worker)

JavaScript runs **client-side** in a sandboxed Web Worker — no backend endpoint, no server
process spawning, and untrusted code never touches the host. The worker is created from a
blob URL, has no DOM access, and is terminated by the main thread on a timeout (~5s) or
when the user stops it. `console.log` output is posted back over `postMessage` and
rendered in the output panel. The source and the result are broadcast over the room's
Socket.IO channel so everyone sees the same run.

**Future multi-language upgrade — Judge0.** Judge0 (self-hosted, or the RapidAPI instance)
would add Python, C++, Java, and friends. It needs a backend proxy endpoint
(`POST /api/execute` → submit source + language id, poll for the result) so the API key
stays server-side, plus per-user rate limiting. Documented as a future upgrade, not part of
the 25–26 Aug scope.
