const transactionService = require("../services/transaction.service");
const { sendSuccess, sendCreated, sendNoContent } = require("../utils/apiResponse");

/**
 * POST /records
 * Admin only. Creates a new financial transaction.
 */
const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.body, req.user._id);

    return sendCreated(res, {
      message: "Transaction created successfully.",
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /records
 * All authenticated roles. Returns paginated, filtered transactions.
 */
const getTransactions = async (req, res, next) => {
  try {
    const { transactions, meta } = await transactionService.getTransactions(req.query);

    return sendSuccess(res, {
      message: "Transactions retrieved successfully.",
      data: { transactions },
      meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /records/:id
 * Admin only. Updates an existing transaction.
 */
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);

    return sendSuccess(res, {
      message: "Transaction updated successfully.",
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /records/:id
 * Admin only. Soft-deletes a transaction (sets isDeleted = true).
 */
const deleteTransaction = async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id);
    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
