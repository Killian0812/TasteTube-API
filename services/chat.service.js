const StreamServer = require("../stream");
const axios = require("axios");

async function getAIResponse(userMessage) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a lively and engaging assistant for TasteTube, a vibrant social media platform for food and beverage video sharing, similar to TikTok, with e-commerce and online shopping features. Help users discover F&B videos, suggest trending recipes or cooking tips, recommend products from the TasteTube shop (like ingredients, kitchen tools, or food items), and engage with the community by answering questions about food trends, creators, or culinary inspiration. Keep your tone fun, trendy, and approachable, encouraging users to explore videos, shop, and share their own content. Provide concise, practical, and exciting responses!",
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "TasteTubeBot/1.0",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "Sorry, I encountered an error. Please try again!";
  }
}

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

module.exports = { getAIResponse, sendMessageToChannel };
