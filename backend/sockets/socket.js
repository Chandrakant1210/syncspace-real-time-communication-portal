const jwt = require("jsonwebtoken");

/**
 * In-memory presence store.
 *
 * Structure:
 *   roomPresence: Map<roomId, Map<socketId, { userId, name }>>
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
 * This is in-memory for the MVP.
 * It resets when the backend restarts.
 */
const roomWhiteboards = new Map();

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Returns the current user list for a room as a plain array. */
const getRoomUsers = (roomId) => {
  const room = roomPresence.get(roomId);
  if (!room) return [];
  return Array.from(room.values()); // [{ userId, name, socketId }, ...]
};

/** Adds a socket to a room's presence map. */
const addToRoom = (roomId, socketId, userData) => {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }
  roomPresence.get(roomId).set(socketId, { ...userData, socketId });
};

/** Removes a socket from a room's presence map. Returns the user data or null. */
const removeFromRoom = (roomId, socketId) => {
  const room = roomPresence.get(roomId);
  if (!room) return null;

  const user = room.get(socketId);
  room.delete(socketId);

  // Clean up empty rooms from memory
  if (room.size === 0) {
    roomPresence.delete(roomId);
  }

  return user || null;
};

/** Returns an array of all roomIds the given socketId is present in. */
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
/*  Optional JWT guard for socket connections                           */
/* ------------------------------------------------------------------ */

/**
 * Validates the JWT sent in `socket.handshake.auth.token`.
 * Returns the decoded payload on success, or null if no token is present.
 * Disconnects the socket and throws if the token is present but invalid.
 */
const verifySocketToken = (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return null; // anonymous connection — allow for MVP

  if (!process.env.JWT_SECRET) {
    console.warn("[socket] JWT_SECRET not set — skipping token verification");
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.warn(`[socket] Invalid token from ${socket.id}: ${err.message}`);
    socket.emit("auth:error", { message: "Invalid or expired token" });
    socket.disconnect(true);
    return null;
  }
};

/* ------------------------------------------------------------------ */
/*  Socket event handlers                                               */
/* ------------------------------------------------------------------ */

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`[socket] Connected: ${socket.id}`);

    // Optionally verify JWT on connect (token sent in handshake auth)
    verifySocketToken(socket);

    /* -------------------------------------------------------------- */
    /*  room:join                                                       */
    /*  Client joins a collaboration room.                             */
    /*  Payload: { roomId, userId, name }                              */
    /* -------------------------------------------------------------- */
    socket.on("room:join", ({ roomId, userId, name } = {}) => {
      if (!roomId) {
        return socket.emit("room:error", { message: "roomId is required" });
      }

      const userName = name || "Anonymous";
      const userIdStr = userId ? String(userId) : socket.id;

      // Join the Socket.IO room so broadcasts reach this socket
      socket.join(roomId);

      // Track presence
      addToRoom(roomId, socket.id, { userId: userIdStr, name: userName });

      console.log(
        `[socket] ${userName} (${socket.id}) joined room ${roomId}`
      );

      // Broadcast to everyone else in the room
      socket.to(roomId).emit("user:joined", {
        userId: userIdStr,
        name: userName,
        socketId: socket.id,
        users: getRoomUsers(roomId),
      });

      // Confirm to the joining client with the current room user list
      socket.emit("room:joined", {
        roomId,
        users: getRoomUsers(roomId),
      });
    });


    /* -------------------------------------------------------------- */
    /*  whiteboard:join                                                */
    /*  Sends the current whiteboard state to the joining client.       */
    /*  Payload: { roomId }                                             */
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

      const strokes = Array.from(roomWhiteboards.get(roomId).values());

      socket.emit("whiteboard:state", {
        roomId,
        strokes,
      });

      console.log(
        `[whiteboard] ${socket.id} loaded ${strokes.length} strokes from room ${roomId}`
      );
    });


    /* -------------------------------------------------------------- */
    /*  whiteboard:draw                                                */
    /*  Stores a stroke and broadcasts it to everyone else in room.    */
    /*  Payload: { roomId, stroke }                                    */
    /* -------------------------------------------------------------- */
    socket.on("whiteboard:draw", ({ roomId, stroke } = {}) => {
      if (!roomId || !stroke) {
        return socket.emit("room:error", {
          message: "roomId and stroke are required",
        });
      }

      if (!roomWhiteboards.has(roomId)) {
        roomWhiteboards.set(roomId, new Map());
      }

      const strokeId =
        stroke.id || `${socket.id}-${Date.now()}-${Math.random()}`;

      const savedStroke = {
        ...stroke,
        id: strokeId,
      };

      roomWhiteboards.get(roomId).set(strokeId, savedStroke);

      // Send the new stroke to everyone else in the room.
      socket.to(roomId).emit("whiteboard:draw", {
        roomId,
        stroke: savedStroke,
      });

      console.log(
        `[whiteboard] stroke ${strokeId} added to room ${roomId}`
      );
    });


    /* -------------------------------------------------------------- */
    /*  whiteboard:erase                                               */
    /*  Removes one stroke and broadcasts the removal to the room.     */
    /*  Payload: { roomId, strokeId }                                  */
    /* -------------------------------------------------------------- */
    socket.on("whiteboard:erase", ({ roomId, strokeId } = {}) => {
      if (!roomId || !strokeId) {
        return socket.emit("room:error", {
          message: "roomId and strokeId are required",
        });
      }

      const room = roomWhiteboards.get(roomId);

      if (!room) {
        return;
      }

      const removed = room.delete(String(strokeId));

      if (!removed) {
        return;
      }

      io.to(roomId).emit("whiteboard:erase", {
        roomId,
        strokeId: String(strokeId),
      });

      console.log(
        `[whiteboard] stroke ${strokeId} erased from room ${roomId}`
      );
    });

    /* -------------------------------------------------------------- */
    /*  whiteboard:clear                                               */
    /*  Clears the whiteboard for everyone in the room.                */
    /*  Payload: { roomId }                                             */
    /* -------------------------------------------------------------- */
    socket.on("whiteboard:clear", ({ roomId } = {}) => {
      if (!roomId) {
        return socket.emit("room:error", {
          message: "roomId is required",
        });
      }

      // Remove all stored strokes for this room.
      roomWhiteboards.delete(roomId);

      // Tell everyone in the room to clear their canvas.
      io.to(roomId).emit("whiteboard:clear", {
        roomId,
      });

      console.log(
        `[whiteboard] cleared room ${roomId}`
      );
    });



    /* -------------------------------------------------------------- */
    /*  room:leave                                                      */
    /*  Client explicitly leaves a collaboration room.                  */
    /*  Payload: { roomId }                                             */
    /* -------------------------------------------------------------- */
    socket.on("room:leave", ({ roomId } = {}) => {
      if (!roomId) {
        return socket.emit("room:error", { message: "roomId is required" });
      }

      const user = removeFromRoom(roomId, socket.id);
      socket.leave(roomId);

      if (user) {
        console.log(
          `[socket] ${user.name} (${socket.id}) left room ${roomId}`
        );

        // Broadcast to everyone remaining in the room
        io.to(roomId).emit("user:left", {
          userId: user.userId,
          name: user.name,
          socketId: socket.id,
          users: getRoomUsers(roomId),
        });
      }

      socket.emit("room:left", { roomId });
    });

    /* -------------------------------------------------------------- */
    /*  disconnect                                                      */
    /*  Handles browser tab close / network drop.                       */
    /*  Automatically removes the user from all rooms they were in.     */
    /* -------------------------------------------------------------- */
    socket.on("disconnect", (reason) => {
      console.log(`[socket] Disconnected: ${socket.id} (${reason})`);

      // Find every room this socket was in
      const rooms = getRoomsForSocket(socket.id);

      for (const roomId of rooms) {
        const user = removeFromRoom(roomId, socket.id);

        if (user) {
          console.log(
            `[socket] Auto-removed ${user.name} from room ${roomId} on disconnect`
          );

          // Broadcast to everyone still in that room
          io.to(roomId).emit("user:left", {
            userId: user.userId,
            name: user.name,
            socketId: socket.id,
            users: getRoomUsers(roomId),
          });
        }
      }
    });
  });
};

module.exports = registerSocketHandlers;