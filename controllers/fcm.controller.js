const User = require("../models/user.model");

const updateFcmToken = async (req, res) => {
  const userId = req.userId;
  const { token, platform } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingTokenIndex = user.fcmTokens.findIndex(
      (fcmToken) => fcmToken.platform === platform
    );
    if (existingTokenIndex !== -1) {
      user.fcmTokens[existingTokenIndex].token = token;
    } else {
      user.fcmTokens.push({ platform, token });
    }

    await user.save();

    return res.status(200).json({ message: "FCM token updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

module.exports = {
  updateFcmToken,
};
