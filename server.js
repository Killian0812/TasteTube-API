const { app, server } = require("./core/socket");
const logger = require("./core/logger");
const connectToDatabase = require("./core/mongodb");
const { closeRedisConnection } = require("./core/redis");
const setupMiddlewares = require("./setup/middleware.setup");
const setupRoutes = require("./setup/route.setup");
const cronjobs = require("./cronjob");
require("dotenv").config();

connectToDatabase();
setupMiddlewares(app);
setupRoutes(app);

cronjobs.forEach((job) => job.start());

// Start server
const port = process.env.PORT || 3000;
const ip = process.env.IP || "0.0.0.0";
server.listen(port, ip, () => {
  logger.info(`Server is running at http://${ip}:${port}`);
});

// Shutdown
const shutdown = async () => {
  logger.info("Shutting down server...");
  try {
    await closeRedisConnection();
    server.close();
    logger.info("Server & connections closed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
