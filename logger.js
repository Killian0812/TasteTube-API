const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    process.env.VERCEL ? winston.format.simple() : winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `[${level}] ${timestamp}: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ""
      }`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

module.exports = logger;
