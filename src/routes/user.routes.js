const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { updateUserValidator } = require("../validators/user.validators");
const { validate } = require("../middleware/validate.middleware");
const { authenticateUser, authorizeRoles } = require("../middleware/auth.middleware");
const { ROLES } = require("../config/constants");

// All user management routes require authentication + admin role
router.use(authenticateUser, authorizeRoles(ROLES.ADMIN));

/**
 * @route   GET /users
 * @access  Admin
 * @desc    List all users with optional role/status filters and pagination
 */
router.get("/", userController.getAllUsers);

/**
 * @route   PATCH /users/:id
 * @access  Admin
 * @desc    Update a user's name, role, or status
 */
router.patch(
  "/:id",
  updateUserValidator,
  validate,
  userController.updateUser
);

module.exports = router;
