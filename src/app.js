require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { httpLogger } = require("./utils/logger");
const { apiLimiter } = require("./middleware/rateLimiter.middleware");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");
const { requestId } = require("./middleware/requestId.middleware");
const { setupSwagger } = require("./config/swagger");
const routes = require("./routes/index");

const app = express();

// ── Unique request ID (must be first for full trace coverage) ───────────────
app.use(requestId);

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── HTTP request logging (Morgan) ───────────────────────────────────────────
app.use(httpLogger());

// ── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));       // Prevent large payload attacks
app.use(express.urlencoded({ extended: false }));

// ── Global rate limiter ─────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ── API routes (versioned) ──────────────────────────────────────────────────
app.use("/api/v1", routes);

// ── Swagger UI (development only) ───────────────────────────────────────────
setupSwagger(app);

// ── 404 handler (must be after all routes) ──────────────────────────────────
app.use(notFoundHandler);

// ── Central error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
