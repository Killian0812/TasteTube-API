const { getMessaging } = require("firebase-admin/messaging");
const User = require("../models/user.model");
const logger = require("../logger");

const sendFcmNotification = async ({ userId, title, body, data }) => {
  const user = await User.findById(userId);
  const fcmTokens = user.fcmTokens.map((e) => e.token) || [];
  if (!user || fcmTokens.length == 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: data,
    tokens: fcmTokens,
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    logger.info("Successfully sent message:", response);
  } catch (error) {
    logger.error("Error sending message:", error);
  }
};

module.exports = {
  sendFcmNotification,
};
