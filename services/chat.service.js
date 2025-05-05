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
  } catch (error) {
    console.error("Error sending message to channel:", error);
    throw error;
  }
}

module.exports = { sendMessageToChannel };
