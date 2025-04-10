const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const { StreamChat } = require("stream-chat");
const StreamServer = StreamChat.getInstance(apiKey, apiSecret);

const getUsers = async () => {
  try {
    const response = await StreamServer.queryUsers({});
    console.log("Stream users:", response.users.length);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

const getChannels = async () => {
  try {
    const response = await StreamServer.queryChannels({});
    console.log("Stream channels:", response);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};
// getChannels();

const deleteChannelById = async (channelId) => {
  try {
    const response = await StreamServer.deleteChannels([channelId]);
    console.log("Deleted channel:", channelId);
  } catch (error) {
    console.error("Error deleting channel:", error);
  }
};
// deleteChannelById(
//   "messaging:67433bd4e31151fbdc0fbf26_671157f0e510cd7dd1e8927b"
// );

module.exports = StreamServer;
