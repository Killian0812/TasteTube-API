const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { uploadPath } = require("../utils/path");
const logger = require("../core/logger");

function _cleanupUploads() {
  logger.info("Start disk cleaning");

  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      logger.error("Error reading directory:", err);
      return;
    }

    files.forEach((file, _) => {
      const filePath = path.join(uploadPath, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.error("Error deleting file:", err);
        }
      });
    });
  });
}

const diskCleanJob = cron.schedule("*/30 * * * *", () => {
  _cleanupUploads();
  logger.info("Upload directory cleanup executed.");
});

module.exports = diskCleanJob;
