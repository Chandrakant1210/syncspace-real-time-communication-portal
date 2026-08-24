const jwt = require("jsonwebtoken");

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches
 * `req.user = { id }` for downstream handlers.
 *
 * The token is issued by the auth routes (implemented by Chandrakant) and is
 * expected to carry the user id as `id`, `_id`, `userId`, or `sub`.
 */
const protect = (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized: missing Bearer token",
    });
  }

  const token = header.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized: missing Bearer token",
    });
  }

  if (!process.env.JWT_SECRET) {
    // Misconfiguration, not a client problem — surface it as a 500.
    return next(new Error("JWT_SECRET is not configured on the server"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized: token payload has no user id",
      });
    }

    req.user = { id: String(userId) };
    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Not authorized: token expired"
        : "Not authorized: invalid token";

    return res.status(401).json({ success: false, message });
  }
};

module.exports = protect;
module.exports.protect = protect;
