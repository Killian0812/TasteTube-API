const userService = require("../services/user.service");
const logger = require("../logger");

const getUserInfo = async (req, res) => {
  try {
    const userData = await userService.getUserInfo(
      req.params.userId,
      req.userId
    );
    return res.status(200).json(userData);
  } catch (e) {
    if (e.message === "No user found") {
      return res.status(400).json({ message: e.message });
    }
    if (e.message === "User not found") {
      return res.status(404).json({ message: e.message });
    }
    return res.status(500).json({ message: e.message });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const { username, email, phone, bio } = req.body;
    const userData = await userService.updateUserInfo(
      req.userId,
      username,
      email,
      phone,
      bio,
      req.file,
      req.username
    );
    return res.status(200).json(userData);
  } catch (error) {
    logger.error("Error handling profile update:", error);
    if (error.message.includes("taken")) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const changePassword = async (req, res) => {
  logger.info(`${req.username} changing password`);
  try {
    const { oldPassword, newPassword, matchPassword } = req.body;
    const result = await userService.changePassword(
      req.userId,
      oldPassword,
      newPassword,
      matchPassword
    );
    return res.status(200).json(result);
  } catch (error) {
    logger.info(error);
    if (error.message.includes("password")) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const followUser = async (req, res) => {
  try {
    const result = await userService.followUser(req.params.userId, req.userId);
    return res.status(200).json(result);
  } catch (e) {
    if (e.message === "No user found") {
      return res.status(400).json({ message: e.message, code: 2 });
    }
    if (e.message === "User not found") {
      return res.status(404).json({ message: e.message });
    }
    return res.status(500).json({ message: e.message, code: 2 });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const result = await userService.unfollowUser(
      req.params.userId,
      req.userId
    );
    return res.status(200).json(result);
  } catch (e) {
    if (e.message === "No user found") {
      return res.status(400).json({ message: e.message, code: 2 });
    }
    if (e.message === "User not found") {
      return res.status(404).json({ message: e.message });
    }
    return res.status(500).json({ message: e.message, code: 2 });
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  changePassword,
  followUser,
  unfollowUser,
};
