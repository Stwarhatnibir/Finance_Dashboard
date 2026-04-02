const { body, param, query } = require("express-validator");
const { TRANSACTION_TYPES } = require("../config/constants");

const createTransactionValidator = [
  body("amount")
    .notEmpty().withMessage("Amount is required.")
    .isFloat({ gt: 0 }).withMessage("Amount must be a number greater than 0."),

  body("type")
    .notEmpty().withMessage("Transaction type is required.")
    .isIn(Object.values(TRANSACTION_TYPES))
    .withMessage(`Type must be one of: ${Object.values(TRANSACTION_TYPES).join(", ")}.`),

  body("category")
    .trim()
    .notEmpty().withMessage("Category is required.")
    .isLength({ max: 50 }).withMessage("Category cannot exceed 50 characters."),

  body("date")
    .notEmpty().withMessage("Date is required.")
    .isISO8601().withMessage("Date must be a valid ISO 8601 date (e.g. 2024-01-15)."),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Note cannot exceed 500 characters."),
];

const updateTransactionValidator = [
  param("id")
    .isMongoId().withMessage("Invalid transaction ID format."),

  body("amount")
    .optional()
    .isFloat({ gt: 0 }).withMessage("Amount must be a number greater than 0."),

  body("type")
    .optional()
    .isIn(Object.values(TRANSACTION_TYPES))
    .withMessage(`Type must be one of: ${Object.values(TRANSACTION_TYPES).join(", ")}.`),

  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Category cannot exceed 50 characters."),

  body("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid ISO 8601 date."),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Note cannot exceed 500 characters."),
];

const listTransactionsValidator = [
  query("type")
    .optional()
    .isIn(Object.values(TRANSACTION_TYPES))
    .withMessage(`Type filter must be one of: ${Object.values(TRANSACTION_TYPES).join(", ")}.`),

  query("category")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Category filter cannot exceed 50 characters."),

  query("startDate")
    .optional()
    .isISO8601().withMessage("startDate must be a valid ISO 8601 date."),

  query("endDate")
    .optional()
    .isISO8601().withMessage("endDate must be a valid ISO 8601 date.")
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
        throw new Error("endDate must be after startDate.");
      }
      return true;
    }),

  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
];

module.exports = {
  createTransactionValidator,
  updateTransactionValidator,
  listTransactionsValidator,
};
