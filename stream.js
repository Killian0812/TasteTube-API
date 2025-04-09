const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const { StreamChat } = require("stream-chat");
const StreamServer = StreamChat.getInstance(apiKey, apiSecret);

module.exports = StreamServer;
