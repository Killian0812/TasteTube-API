const StreamServer = require("../stream");

async function sendMessageToChannel(channelType, channelId, messageText) {
  try {
    const channel = StreamServer.channel(channelType, channelId);
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
    const channel = StreamServer.channel(channelType, channelId);
    await channel.sendEvent({
      type: type,
      user_id: userId,
    });
  } catch (error) {
    console.error("Error sending message to channel:", error);
    throw error;
  }
}

module.exports = { sendMessageToChannel, sendEventToChannel };
