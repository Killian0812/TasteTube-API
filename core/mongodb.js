const mongoose = require("mongoose");
const logger = require("./logger");

const connectToDatabase = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  mongoose
    .connect(uri, { dbName: "tastetube", autoIndex: true })
    .then(() => {
      logger.info("MongoDB Cloud connection established successfully");
    })
    .catch((err) => {
      logger.error("MongoDB connection error:", err.message);
      setTimeout(connectToDatabase, 3000); // Retry after 3 seconds
    });
};

module.exports = connectToDatabase;
