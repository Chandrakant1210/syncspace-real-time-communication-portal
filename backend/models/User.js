const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned in queries unless explicitly requested
    },
  },
  { timestamps: true }
);

/**
 * Hash the password before every save, but only when it has been modified
 * (so re-saving an existing document doesn't re-hash an already-hashed value).
 *
 * Mongoose 9: async pre hooks must NOT call next() — the resolved promise
 * signals completion automatically.
 */
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

/**
 * Compare a plain-text candidate password against the stored hash.
 * Used by the login controller to validate credentials.
 *
 * @param {string} enteredPassword - The raw password from the request body
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function matchPassword(
  enteredPassword
) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
