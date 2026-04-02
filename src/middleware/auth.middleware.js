const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/apiResponse");

/**
 * Verifies JWT from the Authorization header and attaches the user to req.
 * Expected header: Authorization: Bearer <token>
 */
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, { statusCode: 401, message: "Authentication token missing or malformed." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return sendError(res, { statusCode: 401, message: "Token is valid but the user no longer exists." });
    }

    if (user.status !== "active") {
      return sendError(res, { statusCode: 403, message: "Your account has been deactivated. Contact an administrator." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, { statusCode: 401, message: "Session has expired. Please log in again." });
    }
    return sendError(res, { statusCode: 401, message: "Invalid authentication token." });
  }
};

/**
 * Role-based access control guard. Must be used after authenticateUser.
 * @param {...string} roles - Permitted roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Access denied. Required role(s): [${roles.join(", ")}]. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };
