const { validationResult } = require("express-validator");
const { sendError } = require("../utils/apiResponse");

/**
 * Reads express-validator results and short-circuits with a 400
 * if any validation rule failed. Attach after validator chains in routes.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));

    return sendError(res, {
      statusCode: 400,
      message: "Validation failed. Please correct the highlighted fields.",
      errors: formatted,
    });
  }

  next();
};

module.exports = { validate };
