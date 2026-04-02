const User = require("../models/User");
const { AppError } = require("../middleware/error.middleware");
const { getPaginationParams, buildPaginationMeta } = require("../utils/pagination");

/**
 * Retrieves a paginated list of all users (admin only).
 */
const getAllUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

/**
 * Updates allowed user fields. Rejects unknown fields to prevent mass-assignment.
 */
const updateUser = async (userId, updates) => {
  const allowedFields = ["name", "role", "status"];
  const sanitized = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      sanitized[key] = updates[key];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new AppError("No valid fields provided for update.", 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: sanitized },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return user;
};

module.exports = { getAllUsers, updateUser };
