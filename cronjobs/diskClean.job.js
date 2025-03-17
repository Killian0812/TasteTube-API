const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { uploadPath } = require("../utils/path");

function _cleanupUploads() {
  console.log("Start disk cleaning");

  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file, _) => {
      const filePath = path.join(uploadPath, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    });
  });
}

const diskCleanJob = cron.schedule("*/30 * * * *", () => {
  _cleanupUploads();
  console.log("Upload directory cleanup executed.");
});

module.exports = diskCleanJob;
