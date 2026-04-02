const authService = require("../services/auth.service");
const { sendSuccess, sendCreated } = require("../utils/apiResponse");

/**
 * POST /auth/register
 * Public. Registers a new user account.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.register({ name, email, password, role });

    return sendCreated(res, {
      message: "Account created successfully.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 * Public. Returns a JWT on successful authentication.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });

    return sendSuccess(res, {
      message: "Login successful.",
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
