require("dotenv").config();

/**
 * Single place the rest of the backend reads environment config from.
 * See .env.example for the variables this expects.
 *
 * Note: config/db.js (the MongoDB connection) is owned by the auth track and
 * lives alongside this file — see docs/API_LIST.md.
 */
const config = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
};

module.exports = config;
