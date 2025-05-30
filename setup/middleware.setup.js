const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");
const { staticFolderPath } = require("../utils/path");
const logger = require("../core/logger");

const setupMiddlewares = (app) => {
  // JSON and URL-encoded body parsing
  app.use(express.json({ limit: "16mb" }));
  app.use(express.urlencoded({ extended: true, limit: "16mb" }));

  // Cookie parsing
  app.use(cookieParser());

  // CORS configuration
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow requests with no origin (e.g., Postman)
      const allowedPatterns = [
        /^https:\/\/taste-tube.*\.web\.app$/,
        /^https:\/\/taste-tube.*\.firebaseapp\.com$/,
        /^https:\/\/admin-taste-tube.*\.web\.app$/,
        /^https:\/\/admin-taste-tube.*\.firebaseapp\.app$/,
        /^http:\/\/localhost:5555$/,
      ];
      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    exposedHeaders: ["x-auth-token"],
  };
  app.use(cors(corsOptions));

  // Swagger API Docs
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Serve static files
  app.use(express.static(staticFolderPath));

  // Payment success/failed routes
  app.get("/payment/success", (_, res) => {
    res.sendFile(`${staticFolderPath}/payment_success.html`, (err) => {
      if (err) {
        logger.error("Error serving payment_success.html:", err.message);
        res.status(500).send("Internal Server Error");
      }
    });
  });

  app.get("/payment/failed", (_, res) => {
    res.sendFile(`${staticFolderPath}/payment_failed.html`, (err) => {
      if (err) {
        logger.error("Error serving payment_failed.html:", err.message);
        res.status(500).send("Internal Server Error");
      }
    });
  });

  // Version endpoint
  const version = require("../package.json").version;
  app.get("/version", (_, res) => {
    res.json({ version });
  });

  // Fallback for SPA (non-API routes)
  app.get(/^\/(?!api|docs).*/, (_, res) => {
    res.sendFile(`${staticFolderPath}/index.html`, (err) => {
      if (err) {
        logger.error("Error serving index.html:", err.message);
        res.status(500).send("Internal Server Error");
      }
    });
  });
};

module.exports = setupMiddlewares;
