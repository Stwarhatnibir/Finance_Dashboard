const { body, param } = require("express-validator");
const { ROLES, USER_STATUS } = require("../config/constants");

const updateUserValidator = [
  param("id")
    .isMongoId().withMessage("Invalid user ID format."),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage("Name must be between 2 and 60 characters."),

  body("role")
    .optional()
    .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}.`),

  body("status")
    .optional()
    .isIn(Object.values(USER_STATUS)).withMessage(`Status must be one of: ${Object.values(USER_STATUS).join(", ")}.`),

  // Prevent password update through this endpoint
  body("password")
    .not().exists().withMessage("Password cannot be updated via this endpoint."),

  body("email")
    .not().exists().withMessage("Email cannot be updated via this endpoint."),
];

module.exports = { updateUserValidator };
