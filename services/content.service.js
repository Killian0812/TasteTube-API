const User = require("../models/user.model");
const Video = require("../models/video.model");
const { getEmbedding } = require("../services/ai.service");

// Text search for users based on username, email, or phone
const searchUsers = async (keyword, userId = null) => {
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
    _id: { $ne: userId }, // Exclude current user
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
    // Lookup for userId
    {
      $lookup: {
        from: "users", // MongoDB collection name (lowercase, pluralized by Mongoose)
        localField: "userId",
        foreignField: "_id",
        as: "userId",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              image: 1,
            },
          },
        ],
      },
    },
    // Unwind userId to convert array to single object
    {
      $unwind: {
        path: "$userId",
        preserveNullAndEmptyArrays: true, // Keep videos if userId is missing
      },
    },
    // Lookup for targetUserId
    {
      $lookup: {
        from: "users",
        localField: "targetUserId",
        foreignField: "_id",
        as: "targetUserId",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              image: 1,
            },
          },
        ],
      },
    },
    // Unwind targetUserId
    {
      $unwind: {
        path: "$targetUserId",
        preserveNullAndEmptyArrays: true, // Keep videos if targetUserId is missing
      },
    },
    // Lookup for products
    {
      $lookup: {
        from: "products", // Assuming Mongoose pluralizes to 'products'
        localField: "products",
        foreignField: "_id",
        as: "products",
        pipeline: [
          // Nested lookup for products.category
          {
            $lookup: {
              from: "categories", // Assuming Mongoose pluralizes to 'categories'
              localField: "category",
              foreignField: "_id",
              as: "category",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    name: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },
          // Nested lookup for products.userId
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userId",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    image: 1,
                    username: 1,
                    phone: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: "$userId",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },
    // Project final fields
    {
      $project: {
        title: 1,
        description: 1,
        hashtags: 1,
        url: 1,
        thumbnail: 1,
        userId: 1,
        targetUserId: 1,
        products: 1,
        views: 1,
        createdAt: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return videos;
};

searchVideos("Bombs")
  .then((videos) => {
    console.log("Videos found:", videos);
  })
  .catch((error) => {
    console.error("Error searching videos:", error);
  });

module.exports = {
  searchUsers,
  searchVideos,
};
