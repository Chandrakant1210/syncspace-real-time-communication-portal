const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { httpError } = require("../middleware/errorHandler");

/** Wraps an async handler so rejections reach the central error handler. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Generates a signed JWT for the given user id.
 * Payload: { id } — matches what middleware/auth.js expects.
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

/**
 * Shapes the user object returned to the client.
 * Password is excluded here (it is already excluded by `select: false`
 * in the schema, but being explicit here makes this safe even for queries
 * that use `.select("+password")`).
 */
const sanitiseUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/register                                             */
/* ------------------------------------------------------------------ */

/**
 * Register a new user.
 *
 * Body: { name, email, password }
 *
 * Success: 201 { token, user }
 * Errors:
 *   400 — missing / invalid fields
 *   409 — email already registered
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  // --- Validate required fields ---
  if (!name || !String(name).trim()) {
    throw httpError(400, "Name is required");
  }
  if (!email || !String(email).trim()) {
    throw httpError(400, "Email is required");
  }
  if (!password) {
    throw httpError(400, "Password is required");
  }
  if (String(password).length < 6) {
    throw httpError(400, "Password must be at least 6 characters");
  }

  // --- Check for duplicate email ---
  const existingUser = await User.findOne({
    email: String(email).trim().toLowerCase(),
  });

  if (existingUser) {
    throw httpError(409, "An account with that email already exists");
  }

  // --- Create user (pre-save hook hashes the password) ---
  const user = await User.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: sanitiseUser(user),
  });
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login                                                */
/* ------------------------------------------------------------------ */

/**
 * Login an existing user.
 *
 * Body: { email, password }
 *
 * Success: 200 { token, user }
 * Errors:
 *   400 — missing fields
 *   401 — invalid credentials (intentionally vague to prevent enumeration)
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  // --- Validate required fields ---
  if (!email || !String(email).trim()) {
    throw httpError(400, "Email is required");
  }
  if (!password) {
    throw httpError(400, "Password is required");
  }

  // --- Find user; include password field (excluded by default in schema) ---
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select("+password");

  if (!user) {
    // Intentionally the same message as wrong password to prevent user enumeration
    throw httpError(401, "Invalid email or password");
  }

  // --- Verify password ---
  const passwordMatch = await user.matchPassword(String(password));

  if (!passwordMatch) {
    throw httpError(401, "Invalid email or password");
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: sanitiseUser(user),
  });
});

module.exports = { register, login };
