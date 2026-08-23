const express = require("express");

const protect = require("../middleware/auth");
const {
  createRoom,
  getMyRooms,
  joinRoom,
  leaveRoom,
} = require("../controllers/roomController");

const router = express.Router();

// Every room endpoint requires a valid Bearer token.
router.use(protect);

router.route("/").post(createRoom).get(getMyRooms);
router.post("/join", joinRoom);
router.post("/:id/leave", leaveRoom);

module.exports = router;
