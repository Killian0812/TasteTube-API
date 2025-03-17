const path = require("path");
const rootDir = path.resolve(__dirname, "..");
const staticFolderPath = path.join(rootDir, "static");
const uploadPath = path.join(rootDir, "uploads");

module.exports = {
  rootDir,
  staticFolderPath,
  uploadPath,
};
