const { getMessaging } = require("firebase-admin/messaging");
const User = require("../models/user.model");

const sendFcmNotification = async (userId, title, body) => {
  const user = await User.findById(userId);
  const fcmTokens = user.fcmTokens.map((e) => e.token) || [];
  if (!user || fcmTokens.length == 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    tokens: fcmTokens,
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

module.exports = {
  sendFcmNotification,
};
