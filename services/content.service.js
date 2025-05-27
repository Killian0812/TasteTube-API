const User = require("../models/user.model");
const Video = require("../models/video.model");
const { getEmbedding } = require("../services/ai.service");

// Text search for users based on username, email, or phone
const searchUsers = async (keyword) => {
  if (!keyword || keyword.trim() === "") {
    return [];
  }

  const regex = new RegExp(keyword, "i");

  const users = await User.find({
    $or: [
      { username: { $regex: regex } },
      { email: { $regex: regex } },
      { phone: { $regex: regex } },
    ],
    _id: { $ne: req.userId }, // Exclude current user
  }).select("username email phone image followers followings");

  const usersWithNoVideo = users.map((user) => ({
    ...user.toObject(),
    videos: [],
  }));

  return usersWithNoVideo;
};

// Semantic search for videos based on embedded text
const searchVideos = async (keyword, userId = null) => {
  if (!keyword || keyword.trim() === "") {
    return [];
  }

  const queryEmbedding = await getEmbedding(keyword);
  if (!queryEmbedding) {
    throw new Error("Failed to generate query embedding");
  }

  // Build the match stage to filter videos
  const matchStage = {
    status: "ACTIVE",
    visibility: "PUBLIC",
  };
  if (userId) {
    matchStage.userId = { $ne: userId }; // Exclude current user's videos if userId is provided
  }

  // Perform vector search
  const videos = await Video.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 150,
        limit: 10,
      },
    },
    {
      $match: matchStage,
    },
    {
      $project: {
        title: 1,
        description: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return videos;
};

module.exports = {
  searchUsers,
  searchVideos,
};
