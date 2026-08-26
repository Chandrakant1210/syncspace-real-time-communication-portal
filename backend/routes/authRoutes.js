const express = require("express");

const { register, login } = require("../controllers/authController");

const router = express.Router();

/**
 * Public auth routes — no token required.
 *
 * POST /api/auth/register  → register a new user
 * POST /api/auth/login     → login and receive a JWT
 */
router.post("/register", register);
router.post("/login", login);

module.exports = router;
