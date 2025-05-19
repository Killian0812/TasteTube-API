const path = require("path");
const rootDir = path.resolve(__dirname, "..");
const staticFolderPath = path.join(rootDir, "static");
const uploadPath = process.env.VERCEL ? "/tmp" : path.join(rootDir, "uploads");
const workingDir = process.cwd();

module.exports = {
  rootDir,
  staticFolderPath,
  uploadPath,
  workingDir,
};
