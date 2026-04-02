/**
 * Centralised API response helpers.
 * All responses follow a consistent envelope:
 *   { success, message, data?, meta? }
 */

const sendSuccess = (res, { statusCode = 200, message = "Success", data = null, meta = null } = {}) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const sendError = (res, { statusCode = 500, message = "Internal Server Error", errors = null } = {}) => {
  const payload = { success: false, message };
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const sendCreated = (res, { message = "Resource created successfully", data = null } = {}) =>
  sendSuccess(res, { statusCode: 201, message, data });

const sendNoContent = (res) => res.status(204).send();

module.exports = { sendSuccess, sendError, sendCreated, sendNoContent };
