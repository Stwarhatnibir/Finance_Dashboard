const { randomUUID } = require("crypto");

/**
 * Attaches a unique request ID to every incoming request.
 * The ID is echoed back in the X-Request-ID response header,
 * making it easy to correlate logs with client-reported errors.
 *
 * Priority: honours an existing X-Request-ID from the client (e.g. from a
 * gateway or load balancer) so trace IDs propagate correctly across services.
 */
const requestId = (req, res, next) => {
  const id = req.headers["x-request-id"] || randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
};

module.exports = { requestId };
