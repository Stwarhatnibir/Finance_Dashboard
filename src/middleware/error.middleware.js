const mongoose = require("mongoose");
const logger = require("../utils/logger");
const { sendError } = require("../utils/apiResponse");

/**
 * Central error-handling middleware.
 * Must be registered LAST in the Express middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} → ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    logger.debug(err.stack);
  }

  // ── Mongoose validation error ───────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, { statusCode: 400, message: "Validation failed.", errors });
  }

  // ── Mongoose cast error (e.g. invalid ObjectId) ─────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, {
      statusCode: 400,
      message: `Invalid value for field '${err.path}': ${err.value}`,
    });
  }

  // ── MongoDB duplicate key error ─────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, {
      statusCode: 409,
      message: `A record with this ${field} already exists.`,
    });
  }

  // ── JWT errors (should be caught by middleware but as safety net) ────────
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return sendError(res, { statusCode: 401, message: "Invalid or expired token." });
  }

  // ── Custom operational errors ────────────────────────────────────────────
  if (err.isOperational) {
    return sendError(res, { statusCode: err.statusCode || 400, message: err.message });
  }

  // ── Unknown/unexpected errors ────────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : err.message;

  return sendError(res, { statusCode, message });
};

/**
 * 404 handler for unmatched routes.
 */
const notFoundHandler = (req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Lightweight operational error class to distinguish expected vs unexpected errors.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, notFoundHandler, AppError };
