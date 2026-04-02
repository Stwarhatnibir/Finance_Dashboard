const userService = require("../services/user.service");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * GET /users
 * Admin only. Returns a paginated list of all users.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { users, meta } = await userService.getAllUsers(req.query);

    return sendSuccess(res, {
      message: "Users retrieved successfully.",
      data: { users },
      meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/:id
 * Admin only. Updates a user's name, role, or status.
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    return sendSuccess(res, {
      message: "User updated successfully.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, updateUser };
