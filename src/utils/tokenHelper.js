const jwt = require("jsonwebtoken");

/**
 * Decodes a JWT without verifying the signature.
 * Use ONLY for extracting non-sensitive metadata (e.g. logging).
 * Never use this for access control — always go through authenticateUser.
 *
 * @param {string} token
 * @returns {object|null} decoded payload or null if token is malformed
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

/**
 * Returns the remaining TTL of a token in seconds.
 * Returns 0 if the token is already expired or malformed.
 *
 * @param {string} token
 * @returns {number} seconds remaining
 */
const getTokenTTL = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  const remaining = decoded.exp - Math.floor(Date.now() / 1000);
  return Math.max(0, remaining);
};

module.exports = { decodeToken, getTokenTTL };
