const express = require("express");

const protect = require("../middleware/auth");
const {
  runCode,
} = require("../controllers/codeExecutionController");

const router = express.Router();

/*
 * All code-execution endpoints require authentication.
 */
router.use(protect);

/*
 * POST /api/code/run
 *
 * Execute JavaScript, Python, C, C++, or Java code.
 */
router.post("/run", runCode);

module.exports = router;