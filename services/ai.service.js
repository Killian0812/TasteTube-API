const { generateText, embed, embedMany } = require("ai");
const { openai } = require("@ai-sdk/openai");
const openAiModels = {
  gpt4o: openai("gpt-4o"),
  textEmbedding3Small: openai.embedding("text-embedding-3-small"),
};

const systemInstruction = `You are a lively and engaging assistant for TasteTube, a vibrant social media platform for food and beverage video sharing, similar to TikTok, with e-commerce and online shopping features. Help users discover F&B videos, suggest trending recipes or cooking tips, recommend products from the TasteTube shop (like ingredients, kitchen tools, or food items), and engage with the community by answering questions about food trends, creators, or culinary inspiration. Keep your tone fun, trendy, and approachable, encouraging users to explore videos, shop, and share their own content. Provide concise, practical, and exciting responses!`;

async function getAIResponse(userMessage, model = openAiModels.gpt4o) {
  try {
    const { text } = await generateText({
      model: model,
      system: systemInstruction,
      prompt: userMessage,
    });
    return text;
  } catch (error) {
    console.error("Error calling OpenAI using AI SDK:", error);
    return "Sorry, I encountered an error. Please try again!";
  }
}

async function getEmbedding(text, model = openAiModels.textEmbedding3Small) {
  try {
    const { embedding } = await embed({
      model,
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

async function getEmbeddings(texts, model = openAiModels.textEmbedding3Small) {
  try {
    const { embeddings } = await embedMany({
      model,
      values: texts,
    });
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return null;
  }
}

module.exports = { getAIResponse, getEmbedding, getEmbeddings };
