const userService = require("../services/user.service");
const logger = require("../core/logger");

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
    return res.status(500).json({ message: error.message });
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

const getUsers = async (req, res) => {
  try {
    const { page, limit, role, status, search } = req.query;
    const result = await userService.getUsers({
      page,
      limit,
      role,
      status,
      search,
    });
    return res.status(200).json(result);
  } catch (e) {
    logger.error("Error fetching users:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const result = await userService.updateUserStatus(userId, status, req.user);
    return res.status(200).json(result);
  } catch (e) {
    logger.error("Error updating user status:", e);
    if (
      e.message.includes("No user found") ||
      e.message.includes("User not found")
    ) {
      return res.status(404).json({ message: e.message });
    }
    if (
      e.message.includes("Unauthorized") ||
      e.message.includes("own status")
    ) {
      return res.status(403).json({ message: e.message });
    }
    if (e.message.includes("Invalid status")) {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  changePassword,
  followUser,
  unfollowUser,
  getUsers,
  updateUserStatus,
};
