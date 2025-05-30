const logger = require("../core/logger");
const streamClient = require("../core/stream");

async function sendMessageToChannel(channelType, channelId, messageText) {
  try {
    const channel = streamClient.channel(channelType, channelId);
    await channel.sendMessage({
      text: messageText,
      user: {
        id: process.env.STREAM_BOT_ID,
        username: "TasteTube Bot",
      },
    });
    await sendEventToChannel(
      channelType,
      channelId,
      "typing.stop",
      process.env.STREAM_BOT_ID
    );
  } catch (error) {
    console.error("Error sending message to channel:", error);
    throw error;
  }
}

async function sendEventToChannel(channelType, channelId, type, userId) {
  try {
    const channel = streamClient.channel(channelType, channelId);
    await channel.sendEvent({
      type: type,
      user_id: userId,
    });
  } catch (error) {
    logger.error("Error sending message to channel:", error);
  }
}

module.exports = { sendMessageToChannel, sendEventToChannel };
