const chatService = require("../services/chat.service");
const User = require("../models/user.model");

const autoAIResponse = async (req, res) => {
  try {
    const { type, message, user, channel_id, channel_type } = req.body;

    // Handle only new messages
    if (type !== "message.new") {
      return res.status(200).send("Ignored non-message event");
    }

    // Ignore messages from the bot or admin to prevent loops
    if (user.id === process.env.STREAM_BOT_ID) {
      return res.status(200).send("Ignored bot message");
    }

    const sender = await User.findById(user.id);
    if (sender.role === "ADMIN") {
      return res.status(200).send("Ignored admin message");
    }

    // Process the message and get AI response
    const aiResponse = await chatService.getAIResponse(message.text);

    // Send the AI response back to the channel
    await chatService.sendMessageToChannel(
      channel_type,
      channel_id,
      aiResponse
    );

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  autoAIResponse,
};
