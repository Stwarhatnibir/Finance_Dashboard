const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transaction.controller");
const {
  createTransactionValidator,
  updateTransactionValidator,
  listTransactionsValidator,
} = require("../validators/transaction.validators");
const { validate } = require("../middleware/validate.middleware");
const { authenticateUser, authorizeRoles } = require("../middleware/auth.middleware");
const { ROLES } = require("../config/constants");

// All transaction routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /records
 * @access  Admin
 * @desc    Create a new transaction
 */
router.post(
  "/",
  authorizeRoles(ROLES.ADMIN),
  createTransactionValidator,
  validate,
  transactionController.createTransaction
);

/**
 * @route   GET /records
 * @access  Viewer, Analyst, Admin
 * @desc    Get all transactions with filtering and pagination
 */
router.get(
  "/",
  listTransactionsValidator,
  validate,
  transactionController.getTransactions
);

/**
 * @route   PATCH /records/:id
 * @access  Admin
 * @desc    Update a transaction by ID
 */
router.patch(
  "/:id",
  authorizeRoles(ROLES.ADMIN),
  updateTransactionValidator,
  validate,
  transactionController.updateTransaction
);

/**
 * @route   DELETE /records/:id
 * @access  Admin
 * @desc    Soft-delete a transaction by ID
 */
router.delete(
  "/:id",
  authorizeRoles(ROLES.ADMIN),
  transactionController.deleteTransaction
);

module.exports = router;
