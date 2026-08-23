const mongoose = require("mongoose");

const Room = require("../models/Room");
const { httpError } = require("../middleware/errorHandler");

// Fields pulled in when a room is returned with its people attached.
const USER_FIELDS = "name email";

/** Wraps an async handler so rejections reach the central error handler. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Attaches owner/member details, but only once models/User.js (auth track) has
 * been registered — otherwise Mongoose throws MissingSchemaError and the room
 * endpoints would be unusable until that file lands. Ids are returned raw
 * meanwhile, which the frontend can already work with.
 */
const populateRoom = (query) =>
  mongoose.models.User
    ? query.populate("owner", USER_FIELDS).populate("members", USER_FIELDS)
    : query;

const isMember = (room, userId) =>
  room.members.some((member) => String(member._id || member) === String(userId));

/**
 * POST /api/rooms
 * Body: { name, description? }
 * Creates a room owned by the caller, who also becomes its first member.
 */
const createRoom = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};

  if (!name || !String(name).trim()) {
    throw httpError(400, "Room name is required");
  }

  const userId = req.user.id;

  // roomCode is random, so a collision is possible but rare — retry a few times
  // before giving up rather than failing the whole request on first duplicate.
  const MAX_ATTEMPTS = 5;
  let room;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      room = await Room.create({
        name: String(name).trim(),
        description: description ? String(description).trim() : "",
        owner: userId,
        members: [userId],
        roomCode: Room.generateRoomCode(),
      });
      break;
    } catch (error) {
      const duplicateCode = error.code === 11000 && error.keyPattern?.roomCode;
      if (!duplicateCode || attempt === MAX_ATTEMPTS) throw error;
    }
  }

  const populated = await populateRoom(Room.findById(room._id));

  res.status(201).json({
    success: true,
    message: "Room created",
    room: populated,
  });
});

/**
 * GET /api/rooms
 * Lists every room the caller belongs to, most recently active first.
 */
const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await populateRoom(
    Room.find({ members: req.user.id }).sort({ updatedAt: -1 })
  );

  res.json({
    success: true,
    count: rooms.length,
    rooms,
  });
});

/**
 * POST /api/rooms/join
 * Body: { roomCode }
 * Adds the caller to the room with that code. Re-joining is a no-op, not an error.
 */
const joinRoom = asyncHandler(async (req, res) => {
  const rawCode = req.body?.roomCode;

  if (!rawCode || !String(rawCode).trim()) {
    throw httpError(400, "Room code is required");
  }

  const roomCode = String(rawCode).trim().toUpperCase();
  const room = await Room.findOne({ roomCode });

  if (!room) {
    throw httpError(404, "No room found with that code");
  }

  if (isMember(room, req.user.id)) {
    const populated = await populateRoom(Room.findById(room._id));
    return res.json({
      success: true,
      message: "You are already a member of this room",
      room: populated,
    });
  }

  room.members.push(req.user.id);
  await room.save();

  const populated = await populateRoom(Room.findById(room._id));

  res.json({
    success: true,
    message: "Joined room",
    room: populated,
  });
});

/**
 * POST /api/rooms/:id/leave
 * Removes the caller from the room. When the owner leaves, ownership passes to
 * the next remaining member; if nobody is left, the room is deleted.
 */
const leaveRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    throw httpError(404, "Room not found");
  }

  if (!isMember(room, req.user.id)) {
    throw httpError(400, "You are not a member of this room");
  }

  room.members = room.members.filter(
    (member) => String(member) !== String(req.user.id)
  );

  if (room.members.length === 0) {
    await room.deleteOne();
    return res.json({
      success: true,
      message: "Left room. The room was empty and has been deleted.",
      roomDeleted: true,
    });
  }

  if (String(room.owner) === String(req.user.id)) {
    room.owner = room.members[0];
  }

  await room.save();

  const populated = await populateRoom(Room.findById(room._id));

  res.json({
    success: true,
    message: "Left room",
    roomDeleted: false,
    room: populated,
  });
});

module.exports = { createRoom, getMyRooms, joinRoom, leaveRoom };
