const dashboardService = require("../services/dashboard.service");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * GET /dashboard/summary
 * Analyst + Admin. Returns aggregated financial overview.
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary();

    return sendSuccess(res, {
      message: "Dashboard summary retrieved successfully.",
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /dashboard/trends
 * Analyst + Admin. Returns monthly income vs expense for last 12 months.
 */
const getMonthlyTrends = async (req, res, next) => {
  try {
    const trends = await dashboardService.getMonthlyTrends();

    return sendSuccess(res, {
      message: "Monthly trends retrieved successfully.",
      data: trends,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getMonthlyTrends };
