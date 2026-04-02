const Transaction = require("../models/Transaction");

/**
 * Returns a high-level financial summary using MongoDB aggregation.
 * Includes: totalIncome, totalExpense, netBalance,
 *           category-wise totals, and last 5 transactions.
 */
const getSummary = async () => {
  const [aggregateResult, categoryTotals, recentTransactions] = await Promise.all([
    // ── Overall income / expense totals ────────────────────────────────────
    Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),

    // ── Category-wise breakdown ────────────────────────────────────────────
    Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $group: {
          _id: "$_id.type",
          categories: {
            $push: {
              category: "$_id.category",
              total: "$total",
              count: "$count",
            },
          },
        },
      },
    ]),

    // ── Last 5 transactions ────────────────────────────────────────────────
    Transaction.find({ isDeleted: false })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate("createdBy", "name email"),
  ]);

  // ── Shape the aggregation results ──────────────────────────────────────
  const totals = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
  for (const item of aggregateResult) {
    if (item._id === "income") {
      totals.income = parseFloat(item.total.toFixed(2));
      totals.incomeCount = item.count;
    } else if (item._id === "expense") {
      totals.expense = parseFloat(item.total.toFixed(2));
      totals.expenseCount = item.count;
    }
  }

  const categoryBreakdown = {};
  for (const group of categoryTotals) {
    categoryBreakdown[group._id] = group.categories.map((c) => ({
      ...c,
      total: parseFloat(c.total.toFixed(2)),
    }));
  }

  return {
    totalIncome: totals.income,
    totalExpense: totals.expense,
    netBalance: parseFloat((totals.income - totals.expense).toFixed(2)),
    transactionCounts: {
      income: totals.incomeCount,
      expense: totals.expenseCount,
      total: totals.incomeCount + totals.expenseCount,
    },
    categoryBreakdown,
    recentTransactions,
  };
};

/**
 * Returns monthly income vs expense trends for the past 12 months.
 * Useful for time-series charts on the frontend dashboard.
 */
const getMonthlyTrends = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const trends = await Transaction.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $group: {
        _id: { year: "$_id.year", month: "$_id.month" },
        data: {
          $push: {
            type: "$_id.type",
            total: "$total",
            count: "$count",
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // ── Normalise into a clean month-by-month array ────────────────────────
  const formatted = trends.map(({ _id, data }) => {
    const entry = {
      year: _id.year,
      month: _id.month,
      // Human-readable label e.g. "Jan 2024"
      label: new Date(_id.year, _id.month - 1, 1).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),
      income: 0,
      expense: 0,
      incomeCount: 0,
      expenseCount: 0,
    };

    for (const item of data) {
      if (item.type === "income") {
        entry.income = parseFloat(item.total.toFixed(2));
        entry.incomeCount = item.count;
      } else if (item.type === "expense") {
        entry.expense = parseFloat(item.total.toFixed(2));
        entry.expenseCount = item.count;
      }
    }

    entry.net = parseFloat((entry.income - entry.expense).toFixed(2));
    return entry;
  });

  return { period: "last_12_months", trends: formatted };
};

module.exports = { getSummary, getMonthlyTrends };
