/**
 * Builds an Error carrying an HTTP status code, so controllers can
 * `throw httpError(404, "Room not found")` and let this module format it.
 */
const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/** 404 handler for unmatched routes — runs just before the error handler. */
const notFound = (req, res, next) => {
  next(httpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/** Central Express error handler. Always responds with { success, message }. */
// eslint-disable-next-line no-unused-vars -- Express identifies this by arity (4 args).
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose: bad ObjectId in a param/body field.
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: schema validation failed — join the field messages.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongo: unique index violation (e.g. duplicate roomCode).
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}`;
  }

  if (statusCode >= 500) {
    console.error("[error]", err);
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
module.exports.notFound = notFound;
module.exports.httpError = httpError;
