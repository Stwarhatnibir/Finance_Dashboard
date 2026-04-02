const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../middleware/error.middleware");

/**
 * Registers a new user.
 * Throws AppError if the email is already in use.
 */
const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({ name, email, password, role });
  return user;
};

/**
 * Authenticates a user and returns a signed JWT.
 * Throws AppError on invalid credentials or inactive account.
 */
const login = async ({ email, password }) => {
  // Explicitly select password for comparison (schema hides it by default)
  const user = await User.findByEmailWithPassword(email);

  if (!user) {
    // Use a generic message to avoid email enumeration
    throw new AppError("Invalid email or password.", 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken(user._id, user.role);

  // Remove password from the returned object
  user.password = undefined;

  return { token, user };
};

/**
 * Signs a JWT containing userId and role.
 */
const signToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

module.exports = { register, login };
