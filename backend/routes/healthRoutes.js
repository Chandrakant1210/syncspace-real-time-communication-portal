const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// mongoose.connection.readyState -> human-readable label
const DB_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

/**
 * GET /api/health
 * Liveness probe used by the frontend's "backend connection" check.
 */
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    db: DB_STATES[mongoose.connection.readyState] || "unknown",
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;
