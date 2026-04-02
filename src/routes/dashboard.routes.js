const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const { authenticateUser, authorizeRoles } = require("../middleware/auth.middleware");
const { ROLES } = require("../config/constants");

// Dashboard endpoints require authentication + at minimum analyst role
router.use(authenticateUser, authorizeRoles(ROLES.ANALYST, ROLES.ADMIN));

/**
 * @route   GET /dashboard/summary
 * @access  Analyst, Admin
 * @desc    Get aggregated financial summary (totals, categories, recent txns)
 */
router.get("/summary", dashboardController.getSummary);

/**
 * @route   GET /dashboard/trends
 * @access  Analyst, Admin
 * @desc    Get monthly income vs expense trends for the last 12 months
 */
router.get("/trends", dashboardController.getMonthlyTrends);

module.exports = router;
