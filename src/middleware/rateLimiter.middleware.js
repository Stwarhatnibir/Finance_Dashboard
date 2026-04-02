const rateLimit = require("express-rate-limit");
const { sendError } = require("../utils/apiResponse");

/**
 * General API rate limiter.
 * Values driven by environment variables so they can be tuned per deployment.
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,   // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendError(res, {
      statusCode: 429,
      message: "Too many requests. Please slow down and try again later.",
    });
  },
});

/**
 * Stricter limiter for authentication endpoints to mitigate brute-force.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendError(res, {
      statusCode: 429,
      message: "Too many authentication attempts. Please wait 15 minutes before retrying.",
    });
  },
});

module.exports = { apiLimiter, authLimiter };
