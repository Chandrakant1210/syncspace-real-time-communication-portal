const jwt = require("jsonwebtoken");

/**
 * In-memory presence store.
 *
 * Structure:
 *   roomPresence: Map<roomId, Map<socketId, { userId, name, socketId }>>
 *
 * This resets on server restart which is acceptable for the MVP.
 * Persistent presence (Redis, etc.) is a future enhancement.
 */
const roomPresence = new Map();

/**
 * Whiteboard state store.
 *
 * Structure:
 *   roomWhiteboards: Map<roomId, Map<strokeId, stroke>>
 *
 * In-memory for MVP.
 * Resets when the backend restarts.
 */
const roomWhiteboards = new Map();

/**
 * Code editor state store.
 *
 * Structure:
 *   roomCodeEditors: Map<roomId, { code, language }>
 *
 * Example:
 *   {
 *     code: "print('Hello')",
 *     language: "python"
 *   }
 *
 * In-memory for MVP.
 * Resets when the backend restarts.
 */
const roomCodeEditors = new Map();

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Returns the current user list for a room as a plain array.
 */
const getRoomUsers = (roomId) => {
  const room = roomPresence.get(roomId);

  if (!room) return [];

  return Array.from(room.values());
};

/**
 * Adds a socket to a room's presence map.
 */
const addToRoom = (roomId, socketId, userData) => {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }

  roomPresence.get(roomId).set(socketId, {
    ...userData,
    socketId,
  });
};

/**
 * Removes a socket from a room's presence map.
 * Returns the user data or null.
 */
const removeFromRoom = (roomId, socketId) => {
  const room = roomPresence.get(roomId);

  if (!room) return null;

  const user = room.get(socketId);

  room.delete(socketId);

  // Clean up empty rooms from memory.
  if (room.size === 0) {
    roomPresence.delete(roomId);
  }

  return user || null;
};

/**
 * Returns an array of all roomIds
 * the given socketId is present in.
 */
const getRoomsForSocket = (socketId) => {
  const rooms = [];

  for (const [roomId, members] of roomPresence.entries()) {
    if (members.has(socketId)) {
      rooms.push(roomId);
    }
  }

  return rooms;
};

/* ------------------------------------------------------------------ */
/*  Optional JWT guard for socket connections                         */
/* ------------------------------------------------------------------ */

/**
 * Validates the JWT sent in socket.handshake.auth.token.
 *
 * Returns decoded payload on success.
 * Returns null if no token is present.
 *
 * If a token is present but invalid,
 * the socket is disconnected.
 */
const verifySocketToken = (socket) => {
  const token = socket.handshake.auth?.token;

  // Anonymous connection allowed for MVP.
  if (!token) return null;

  if (!process.env.JWT_SECRET) {
    console.warn(
      "[socket] JWT_SECRET not set — skipping token verification"
    );

    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.warn(
      `[socket] Invalid token from ${socket.id}: ${err.message}`
    );

    socket.emit("auth:error", {
      message: "Invalid or expired token",
    });

    socket.disconnect(true);

    return null;
  }
};

/* ------------------------------------------------------------------ */
/*  Socket event handlers                                             */
/* ------------------------------------------------------------------ */

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`[socket] Connected: ${socket.id}`);

    // Optionally verify JWT on connect.
    verifySocketToken(socket);

    /* -------------------------------------------------------------- */
    /*  room:join                                                     */
    /*  Client joins a collaboration room.                            */
    /*  Payload: { roomId, userId, name }                              */
    /* -------------------------------------------------------------- */

    socket.on("room:join", ({ roomId, userId, name } = {}) => {
      if (!roomId) {
        return socket.emit("room:error", {
          message: "roomId is required",
        });
      }

      const userName = name || "Anonymous";

      const userIdStr = userId
        ? String(userId)
        : socket.id;

      // Join Socket.IO room.
      socket.join(roomId);

      // Track presence.
      addToRoom(roomId, socket.id, {
        userId: userIdStr,
        name: userName,
      });

      console.log(
        `[socket] ${userName} (${socket.id}) joined room ${roomId}`
      );

      // Notify everyone else.
      socket.to(roomId).emit("user:joined", {
        userId: userIdStr,
        name: userName,
        socketId: socket.id,
        users: getRoomUsers(roomId),
      });

      // Confirm to joining client.
      socket.emit("room:joined", {
        roomId,
        users: getRoomUsers(roomId),
      });
    });

    /* -------------------------------------------------------------- */
    /*  whiteboard:join                                               */
    /*  Sends current whiteboard state to joining client.             */
    /*  Payload: { roomId }                                            */
    /* -------------------------------------------------------------- */

    socket.on("whiteboard:join", ({ roomId } = {}) => {
      if (!roomId) {
        return socket.emit("room:error", {
          message: "roomId is required",
        });
      }

      if (!roomWhiteboards.has(roomId)) {
        roomWhiteboards.set(roomId, new Map());
      }

      const strokes = Array.from(
        roomWhiteboards.get(roomId).values()
      );

      socket.emit("whiteboard:state", {
        roomId,
        strokes,
      });

      console.log(
        `[whiteboard] ${socket.id} loaded ${strokes.length} strokes from room ${roomId}`
      );
    });

    /* -------------------------------------------------------------- */
    /*  whiteboard:draw                                               */
    /*  Stores a stroke and broadcasts it to everyone else.           */
    /*  Payload: { roomId, stroke }                                    */
    /* -------------------------------------------------------------- */

    socket.on(
      "whiteboard:draw",
      ({ roomId, stroke } = {}) => {
        if (!roomId || !stroke) {
          return socket.emit("room:error", {
            message: "roomId and stroke are required",
          });
        }

        if (!roomWhiteboards.has(roomId)) {
          roomWhiteboards.set(roomId, new Map());
        }

        const strokeId =
          stroke.id ||
          `${socket.id}-${Date.now()}-${Math.random()}`;

        const savedStroke = {
          ...stroke,
          id: strokeId,
        };

        roomWhiteboards
          .get(roomId)
          .set(strokeId, savedStroke);

        // Send new stroke to everyone else.
        socket.to(roomId).emit("whiteboard:draw", {
          roomId,
          stroke: savedStroke,
        });

        console.log(
          `[whiteboard] stroke ${strokeId} added to room ${roomId}`
        );
      }
    );

    /* -------------------------------------------------------------- */
    /*  whiteboard:erase                                              */
    /*  Removes one stroke and broadcasts removal.                    */
    /*  Payload: { roomId, strokeId }                                 */
    /* -------------------------------------------------------------- */

    socket.on(
      "whiteboard:erase",
      ({ roomId, strokeId } = {}) => {
        if (!roomId || !strokeId) {
          return socket.emit("room:error", {
            message: "roomId and strokeId are required",
          });
        }

        const room = roomWhiteboards.get(roomId);

        if (!room) {
          return;
        }

        const removed = room.delete(
          String(strokeId)
        );

        if (!removed) {
          return;
        }

        io.to(roomId).emit(
          "whiteboard:erase",
          {
            roomId,
            strokeId: String(strokeId),
          }
        );

        console.log(
          `[whiteboard] stroke ${strokeId} erased from room ${roomId}`
        );
      }
    );

    /* -------------------------------------------------------------- */
    /*  whiteboard:clear                                              */
    /*  Clears whiteboard for everyone.                               */
    /*  Payload: { roomId }                                           */
    /* -------------------------------------------------------------- */

    socket.on(
      "whiteboard:clear",
      ({ roomId } = {}) => {
        if (!roomId) {
          return socket.emit("room:error", {
            message: "roomId is required",
          });
        }

        // Remove stored strokes.
        roomWhiteboards.delete(roomId);

        // Tell everyone to clear canvas.
        io.to(roomId).emit(
          "whiteboard:clear",
          {
            roomId,
          }
        );

        console.log(
          `[whiteboard] cleared room ${roomId}`
        );
      }
    );

    /* -------------------------------------------------------------- */
    /*  code-editor:join                                              */
    /*  Sends current code + language to joining client.              */
    /*  Payload: { roomId }                                           */
    /* -------------------------------------------------------------- */

    socket.on(
      "code-editor:join",
      ({ roomId } = {}) => {
        if (!roomId) {
          return socket.emit("room:error", {
            message: "roomId is required",
          });
        }

        /*
         * Get existing editor state.
         *
         * If this is the first user in the room,
         * start with JavaScript.
         */
        const editorState =
          roomCodeEditors.get(roomId) || {
            code: "",
            language: "javascript",
          };

        socket.emit(
          "code-editor:state",
          {
            roomId,
            code: editorState.code,
            language: editorState.language,
          }
        );

        console.log(
          `[code-editor] ${socket.id} loaded ${editorState.language} code for room ${roomId}`
        );
      }
    );

    /* -------------------------------------------------------------- */
    /*  code-editor:update                                            */
    /*  Stores and broadcasts latest code + language.                 */
    /*  Payload: { roomId, code, language }                            */
    /* -------------------------------------------------------------- */

    socket.on(
      "code-editor:update",
      ({
        roomId,
        code,
        language,
      } = {}) => {
        if (!roomId || typeof code !== "string") {
          return socket.emit("room:error", {
            message: "roomId and code are required",
          });
        }

        /*
         * Store both code and selected language.
         */
        const editorState = {
          code,
          language:
            typeof language === "string"
              ? language
              : "javascript",
        };

        roomCodeEditors.set(
          roomId,
          editorState
        );

        /*
         * Broadcast the update to everyone else
         * in the same room.
         */
        socket.to(roomId).emit(
          "code-editor:update",
          {
            roomId,
            code: editorState.code,
            language: editorState.language,
          }
        );

        console.log(
          `[code-editor] ${socket.id} updated ${editorState.language} code in room ${roomId}`
        );
      }
    );

    /* -------------------------------------------------------------- */
    /*  room:leave                                                     */
    /*  Client explicitly leaves a collaboration room.               */
    /*  Payload: { roomId }                                           */
    /* -------------------------------------------------------------- */

    socket.on(
      "room:leave",
      ({ roomId } = {}) => {
        if (!roomId) {
          return socket.emit("room:error", {
            message: "roomId is required",
          });
        }

        const user = removeFromRoom(
          roomId,
          socket.id
        );

        socket.leave(roomId);

        if (user) {
          console.log(
            `[socket] ${user.name} (${socket.id}) left room ${roomId}`
          );

          // Notify remaining users.
          io.to(roomId).emit(
            "user:left",
            {
              userId: user.userId,
              name: user.name,
              socketId: socket.id,
              users: getRoomUsers(roomId),
            }
          );
        }

        socket.emit(
          "room:left",
          {
            roomId,
          }
        );
      }
    );

    /* -------------------------------------------------------------- */
    /*  disconnect                                                     */
    /*  Handles browser close / network drop.                         */
    /* -------------------------------------------------------------- */

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          `[socket] Disconnected: ${socket.id} (${reason})`
        );

        // Find all rooms containing this socket.
        const rooms =
          getRoomsForSocket(socket.id);

        for (const roomId of rooms) {
          const user = removeFromRoom(
            roomId,
            socket.id
          );

          if (user) {
            console.log(
              `[socket] Auto-removed ${user.name} from room ${roomId} on disconnect`
            );

            // Notify remaining users.
            io.to(roomId).emit(
              "user:left",
              {
                userId: user.userId,
                name: user.name,
                socketId: socket.id,
                users: getRoomUsers(roomId),
              }
            );
          }
        }
      }
    );
  });
};

module.exports = registerSocketHandlers;