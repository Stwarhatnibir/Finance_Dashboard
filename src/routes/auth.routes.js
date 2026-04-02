const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { registerValidator, loginValidator } = require("../validators/auth.validators");
const { validate } = require("../middleware/validate.middleware");
const { authLimiter } = require("../middleware/rateLimiter.middleware");

/**
 * @route   POST /auth/register
 * @access  Public
 * @desc    Register a new user account
 */
router.post(
  "/register",
  authLimiter,
  registerValidator,
  validate,
  authController.register
);

/**
 * @route   POST /auth/login
 * @access  Public
 * @desc    Login and receive a JWT
 */
router.post(
  "/login",
  authLimiter,
  loginValidator,
  validate,
  authController.login
);

module.exports = router;
