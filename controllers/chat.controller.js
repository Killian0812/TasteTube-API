const chatService = require("../services/chat.service");
const aiService = require("../services/ai.service");
const Channel = require("../models/channel.model");
const logger = require("../logger");
const { adminUsers } = require("../utils/constant");

const autoAIResponse = async (req, res) => {
  try {
    const { type, message, user, channel_id, channel_type, members } = req.body;

    // Handle only new messages
    if (type !== "message.new") {
      return res.status(200).send("Ignored non-message event");
    }

    const channel = await Channel.findOne({ channelId: channel_id });
    if (channel?.autoResponse == false) {
      return res.status(200).send("Ignored non-auto channel");
    }

    // Ignore messages from the bot or admin to prevent loops
    if (user.id === process.env.STREAM_BOT_ID) {
      return res.status(200).send("Ignored bot message");
    }

    if (adminUsers.includes(user.id)) {
      return res.status(200).send("Ignored admin message");
    }

    // Check if any user in the members list is an admin
    const isAdminInMembers = members.some((member) =>
      adminUsers.includes(member.user_id)
    );
    if (!isAdminInMembers) {
      return res
        .status(200)
        .send("Ignored message from a channel with no admin members");
    }

    // Process the message and get AI response
    const aiResponse = await aiService.getAIResponse(message.text);

    // Send the AI response back to the channel
    await chatService.sendMessageToChannel(
      channel_type,
      channel_id,
      aiResponse
    );

    logger.info("Auto-message generated");
    return res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
};

const getChannelSettings = async (req, res) => {
  try {
    const { channelId } = req.params;

    let channel = await Channel.findOne({ channelId });
    if (!channel) {
      channel = await Channel.create({ channelId });
    }

    return res.status(200).json(channel);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateChannelSettings = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { autoResponse = true } = req.body;

    const channel = await Channel.findOne({ channelId });
    if (!channel) {
      return res.status(400).json({ message: "Invalid channel" });
    }

    channel.autoResponse = autoResponse;
    await channel.save();

    return res.status(200).json(channel);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  autoAIResponse,
  updateChannelSettings,
  getChannelSettings,
};
