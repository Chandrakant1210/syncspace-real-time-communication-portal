# SyncSpace — Real-Time Communication & Collaboration Portal

SyncSpace is a web-based real-time collaboration platform. Users can register,
create or join a room, and collaborate inside that room through a shared
**whiteboard** and a **multi-language collaborative code editor** — with
real, sandboxed code execution — all synchronized live via Socket.IO.

## Features

- **Authentication** — registration, login, JWT-based sessions, protected routes
- **Room management** — create a room, join by room code, leave a room, ownership transfer
- **Real-time presence** — live online/offline participant list per room
- **Collaborative whiteboard** — shared drawing canvas, synced across all room members in real time
- **Collaborative code editor** — shared editor (CodeMirror) with live sync across room members
- **Real code execution** — run JavaScript, Python, C, C++, or Java, with stdin, and see real
  stdout/stderr/exit codes — executed in a sandboxed [Piston](https://github.com/engineer-man/piston)
  runner, not in the Node.js process

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), React Router, Tailwind CSS, CodeMirror 6, Konva/react-konva, Socket.IO client |
| Backend | Node.js, Express, Socket.IO, JWT, Mongoose, bcrypt |
| Database | MongoDB (Atlas or local) |
| Code execution | Self-hosted [Piston](https://github.com/engineer-man/piston) (Docker) |

## Project Structure

```
syncspace-real-time-communication-portal/
├── backend/
│   ├── config/           # env config, DB connection
│   ├── controllers/      # auth, room, code-execution logic
│   ├── docs/             # PISTON_SETUP.md, API_LIST.md
│   ├── middleware/       # JWT auth guard, error handler
│   ├── models/           # User, Room (Mongoose schemas)
│   ├── routes/           # /api/auth, /api/rooms, /api/code, /api/health
│   ├── services/         # codeExecutionService.js (Piston integration)
│   ├── sockets/          # Socket.IO event handlers (presence, rooms, etc.)
│   └── server.js         # app entry point
└── frontend/
    └── src/
        ├── components/   # CodeEditor, Whiteboard, RoomCard, modals, etc.
        ├── hooks/        # useRooms, useRoomPresence, etc.
        ├── pages/        # Login, Register, Dashboard, Rooms, Room, Whiteboard
        └── services/     # api.js (REST), socket.js (Socket.IO client)
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB (a local instance, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- Docker Desktop (only required for real code execution — see below)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Chandrakant1210/syncspace-real-time-communication-portal.git
cd syncspace-real-time-communication-portal

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Then edit `.env`:

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | A long random string used to sign JWTs |
| `PORT` | Port the backend listens on (default `5000`) |
| `CLIENT_URL` | The frontend's origin, used for CORS + Socket.IO (default `http://localhost:5173`) |
| `PISTON_URL` | Base URL of your self-hosted Piston instance (default `http://localhost:2000`) — see below |

### 3. Set up code execution (Piston)

The public Piston API (`emkc.org`) went offline on 31 Aug 2026 and now rejects
every request. Real code execution requires a **self-hosted Piston container**.

Full step-by-step setup (Docker, Windows/WSL2 notes, installing the 5 language
runtimes, and a security/sandbox verification checklist) is documented in
[`backend/docs/PISTON_SETUP.md`](backend/docs/PISTON_SETUP.md). In short:

```bash
docker volume create piston_data
docker run -d --name piston_api -p 2000:2000 --privileged \
  -v piston_data:/piston \
  -e PISTON_RUN_TIMEOUT=5000 -e PISTON_RUN_CPU_TIME=5000 \
  -e PISTON_COMPILE_TIMEOUT=10000 -e PISTON_COMPILE_CPU_TIME=10000 \
  -e PISTON_RUN_MEMORY_LIMIT=268435456 -e PISTON_COMPILE_MEMORY_LIMIT=268435456 \
  -e PISTON_OUTPUT_MAX_SIZE=65536 \
  ghcr.io/engineer-man/piston
```

Then install the runtimes (see `PISTON_SETUP.md` §3 for exact commands) for
`node`, `python`, `gcc` (covers C and C++), and `java`.

Without Piston running, the rest of the app still works — only the "Run" button
in the code editor will show a connection error.

### 4. Run the app

In separate terminals:

```bash
# Backend (http://localhost:5000)
cd backend
npm run dev

# Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open `http://localhost:5173`, register an account, create a room, and open it
in a second browser (or incognito window) with a second account to see
real-time sync in action.

## API Overview

Full request/response documentation is in
[`backend/docs/API_LIST.md`](backend/docs/API_LIST.md). Summary:

| Method & Path | Auth required | Purpose |
| --- | --- | --- |
| `GET /api/health` | No | Liveness probe |
| `POST /api/auth/register` | No | Create an account |
| `POST /api/auth/login` | No | Log in, receive a JWT |
| `POST /api/rooms` | Yes | Create a room |
| `GET /api/rooms` | Yes | List the caller's rooms |
| `POST /api/rooms/join` | Yes | Join a room by room code |
| `POST /api/rooms/:id/leave` | Yes | Leave a room |
| `POST /api/code/run` | Yes | Execute code (JS/Python/C/C++/Java) via Piston |

Real-time events (room presence, whiteboard sync, code sync) run over
Socket.IO — see `API_LIST.md` for the full event list.

## Security Notes

- User-submitted code is never executed inside the Node.js process — it runs
  only inside the isolated Piston sandbox, with enforced timeout, memory, and
  output-size limits.
- All room and code-execution endpoints require a valid JWT (`Authorization: Bearer <token>`).
- Secrets (`JWT_SECRET`, `MONGODB_URI`, `PISTON_URL`) are read from environment
  variables and are never committed — see `.env.example`.

## Known Limitations / Roadmap

- No automated test suite yet — testing has been manual, across multiple
  browsers/accounts.
- Piston currently runs as a separate manually-started Docker container
  (not orchestrated via `docker-compose` alongside the app).
- Video/voice calling, chat, and file sharing were intentionally scoped out to
  protect the core real-time collaboration goals.

## Team

Developed by the SyncSpace team using an Agile workflow with feature branches
and pull requests reviewed before merging into `main`.