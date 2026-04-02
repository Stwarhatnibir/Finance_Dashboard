const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const transactionRoutes = require("./transaction.routes");
const dashboardRoutes = require("./dashboard.routes");

// ── Health check (no auth required) ────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance Dashboard API is running.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Feature routes ──────────────────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/records", transactionRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
