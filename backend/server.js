const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);


const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

// 1. Import your database connection function
const connectDB = require("./config/db");
const config = require("./config");
const registerSocketHandlers = require("./sockets/socket");
const healthRoutes = require("./routes/healthRoutes");
const roomRoutes = require("./routes/roomRoutes");
const codeRoutes = require("./routes/codeRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

/**
 * Requires a module that a teammate may not have merged yet, so the server
 * still boots (sockets + health stay testable) instead of crashing on startup.
 */
const optionalRequire = (path, label) => {
  try {
    return require(path);
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND" && error.message.includes(path)) {
      console.warn(`[startup] ${label} not found yet (${path}) — skipping.`);
      return null;
    }
    throw error;
  }
};

// 2. Run the database connection
connectDB();

const app = express();

/* ---------------- Middleware ---------------- */

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- Database ---------------- */

// models/User.js is implemented by Chandrakant (auth track). Requiring it here
// registers the schema so Room.populate("owner" | "members") can resolve it.
optionalRequire("./models/User", "User model");

/* ---------------- Routes ---------------- */

app.use("/api/health", healthRoutes);

// routes/authRoutes.js is implemented by Chandrakant (auth track).
const authRoutes = optionalRequire("./routes/authRoutes", "Auth routes");
if (authRoutes) {
  app.use("/api/auth", authRoutes);
}

app.use("/api/rooms", roomRoutes);
app.use("/api/code", codeRoutes);

/* ---------------- Error handling ---------------- */

app.use(notFound);
app.use(errorHandler);

/* ---------------- HTTP + Socket.IO ---------------- */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerSocketHandlers(io);

// Handlers elsewhere (e.g. room controllers) can reach the socket server via req.app.get("io").
app.set("io", io);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`CORS origin: ${config.clientUrl}`);
});

module.exports = { app, server, io };
