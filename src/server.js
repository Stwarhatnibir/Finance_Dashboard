require("dotenv").config();

const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

// ── Boot sequence ───────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server running in [${process.env.NODE_ENV || "development"}] mode on port ${PORT}`);
    logger.info(`API base URL: http://localhost:${PORT}/api/v1`);
    logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      logger.info("HTTP server closed.");
      await disconnectDB();
      process.exit(0);
    });

    // Force exit if server hasn't closed within 10 seconds
    setTimeout(() => {
      logger.error("Could not close connections in time. Forcing shutdown.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ── Unhandled promise rejections ──────────────────────────────────────────
  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    shutdown("unhandledRejection");
  });

  // ── Uncaught exceptions ───────────────────────────────────────────────────
  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    shutdown("uncaughtException");
  });
};

startServer();
