const Transaction = require("../models/Transaction");
const { AppError } = require("../middleware/error.middleware");
const { getPaginationParams, buildPaginationMeta } = require("../utils/pagination");

/**
 * Creates a new transaction record.
 */
const createTransaction = async (data, userId) => {
  const transaction = await Transaction.create({
    ...data,
    createdBy: userId,
  });

  return transaction.populate("createdBy", "name email role");
};

/**
 * Returns a paginated, filtered list of transactions.
 * Supports filtering by: type, category, date range.
 */
const getTransactions = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = buildTransactionFilter(query);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("createdBy", "name email")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

/**
 * Updates a transaction. Only admins call this (enforced at route level).
 */
const updateTransaction = async (transactionId, updates) => {
  const allowedFields = ["amount", "type", "category", "date", "note"];
  const sanitized = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      sanitized[key] = updates[key];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new AppError("No valid fields provided for update.", 400);
  }

  const transaction = await Transaction.findByIdAndUpdate(
    transactionId,
    { $set: sanitized },
    { new: true, runValidators: true }
  ).populate("createdBy", "name email");

  if (!transaction) {
    throw new AppError("Transaction not found.", 404);
  }

  return transaction;
};

/**
 * Soft-deletes a transaction by setting isDeleted = true.
 */
const deleteTransaction = async (transactionId) => {
  const transaction = await Transaction.findByIdAndUpdate(
    transactionId,
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  );

  if (!transaction) {
    throw new AppError("Transaction not found.", 404);
  }

  return transaction;
};

// ─── Internal helper ───────────────────────────────────────────────────────

/**
 * Builds the MongoDB filter object from query params.
 */
const buildTransactionFilter = (query) => {
  const filter = {};

  if (query.type) {
    filter.type = query.type;
  }

  if (query.category) {
    // Case-insensitive partial match for category
    filter.category = { $regex: query.category, $options: "i" };
  }

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) {
      // Include the full end day
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  return filter;
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
