const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const fs = require("fs");
const { StreamChat } = require("stream-chat");
const StreamServer = StreamChat.getInstance(apiKey, apiSecret, {
  timeout: 10000,
});
const logger = require("./logger");

const getUsers = async () => {
  try {
    const response = await StreamServer.queryUsers({});
    logger.info("Stream users:", response.users.length);
  } catch (error) {
    logger.error("Error fetching users:", error);
  }
};

const getChannels = async () => {
  try {
    const response = await StreamServer.queryChannels({});
    logger.info("Stream channels:", response);
  } catch (error) {
    logger.error("Error fetching users:", error);
  }
};
// getChannels();

const deleteChannelById = async (channelId) => {
  try {
    const response = await StreamServer.deleteChannels([channelId]);
    logger.info("Deleted channel:", channelId);
  } catch (error) {
    logger.error("Error deleting channel:", error);
  }
};
// deleteChannelById(
//   "messaging:67433bd4e31151fbdc0fbf26_671157f0e510cd7dd1e8927b"
// );

const setupStreamAppConfig = async () => {
  try {
    await StreamServer.updateAppSettings({
      push_config: {
        version: "v2",
      },
      firebase_config: {
        notification_template: fs.readFileSync("./fcm-template.json", "utf-8"),
        credentials_json: fs.readFileSync(
          "./service-account-key.json",
          "utf-8"
        ),
      },
    });
    logger.info("Stream app config updated successfully");
  } catch (error) {
    logger.error("Error setting up Stream app config:", {
      message: error.message,
    });
  }
};

setupStreamAppConfig();

module.exports = StreamServer;
