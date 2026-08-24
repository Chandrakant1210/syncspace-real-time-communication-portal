const mongoose = require("mongoose");
const crypto = require("crypto");

// Ambiguous characters (0/O, 1/I/L) are left out so codes stay easy to read out loud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateRoomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      maxlength: [80, "Room name cannot exceed 80 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    roomCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: generateRoomCode,
    },
  },
  { timestamps: true }
);

// Join-by-code lookups hit this on every joinRoom call; unique keeps codes collision-free.
roomSchema.index({ roomCode: 1 }, { unique: true });

// Dashboard listing ("my rooms") queries by membership, newest first.
roomSchema.index({ members: 1, updatedAt: -1 });

roomSchema.statics.generateRoomCode = generateRoomCode;

module.exports = mongoose.model("Room", roomSchema);
