const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const googleGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = googleGenAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Use gemini-1.5-pro or gemini-1.0-pro
const { generateText } = require("ai");
const { openai } = require("@ai-sdk/openai");
const chatgpt = openai("gpt-4o");

const systemInstruction = `You are a lively and engaging assistant for TasteTube, a vibrant social media platform for food and beverage video sharing, similar to TikTok, with e-commerce and online shopping features. Help users discover F&B videos, suggest trending recipes or cooking tips, recommend products from the TasteTube shop (like ingredients, kitchen tools, or food items), and engage with the community by answering questions about food trends, creators, or culinary inspiration. Keep your tone fun, trendy, and approachable, encouraging users to explore videos, shop, and share their own content. Provide concise, practical, and exciting responses!`;
async function getGeminiResponse(userMessage) {
  try {
    const prompt = `${systemInstruction}\n\nUser: ${userMessage}`;

    // Generate response
    const result = await gemini.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7, // Adjust for creativity (0.0 to 1.0)
      },
    });

    const responseText = result.response.text().trim();
    return responseText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error. Please try again!";
  }
}

async function getGptResponse(userMessage) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemInstruction,
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "Sorry, I encountered an error. Please try again!";
  }
}

async function getAIResponse(userMessage, model = chatgpt) {
  try {
    const { text } = await generateText({
      model: model,
      system: systemInstruction,
      prompt: userMessage,
    });
    console.log(text);
    return text;
  } catch (error) {
    console.error("Error calling OpenAI using AI SDK:", error);
    return "Sorry, I encountered an error. Please try again!";
  }
}

module.exports = { getGptResponse, getGeminiResponse, getAIResponse };
