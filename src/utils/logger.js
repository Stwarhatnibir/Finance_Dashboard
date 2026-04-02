const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// ─── Simple structured logger ──────────────────────────────────────────────
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.LOG_LEVEL || "info";

const format = (level, message) => {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] ${message}`;
};

const logger = {
  error: (msg) => {
    if (LOG_LEVELS[currentLevel] >= LOG_LEVELS.error) {
      console.error(format("error", msg));
    }
  },
  warn: (msg) => {
    if (LOG_LEVELS[currentLevel] >= LOG_LEVELS.warn) {
      console.warn(format("warn", msg));
    }
  },
  info: (msg) => {
    if (LOG_LEVELS[currentLevel] >= LOG_LEVELS.info) {
      console.info(format("info", msg));
    }
  },
  debug: (msg) => {
    if (LOG_LEVELS[currentLevel] >= LOG_LEVELS.debug) {
      console.debug(format("debug", msg));
    }
  },
};

// ─── Morgan HTTP request logger ────────────────────────────────────────────
const getHttpLogger = () => {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    return morgan("dev");
  }

  // In production, write access logs to file
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, "access.log"),
    { flags: "a" }
  );

  return morgan("combined", { stream: accessLogStream });
};

module.exports = logger;
module.exports.httpLogger = getHttpLogger;
