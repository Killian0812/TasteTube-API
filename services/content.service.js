const User = require("../models/user.model");
const { Video, videoPopulate } = require("../models/video.model");
const { getEmbedding } = require("../services/ai.service");

// Text search for users based on username, email, or phone
const _searchUsers = async (keyword, userId = null) => {
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
const _searchVideos = async (keyword, userId = null) => {
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
    // Remove embedding field
    {
      $project: {
        embedding: 0,
      },
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
    // Add score field
    {
      $addFields: {
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return videos;
};

const searchContent = async (keyword, type, userId) => {
  if (!keyword || !type) {
    return { status: 400, data: { message: "Keyword and type are required" } };
  }

  if (type === "user") {
    const users = await _searchUsers(keyword, userId);
    return { status: 200, data: users };
  }

  if (type === "video") {
    const videos = await _searchVideos(keyword, userId);
    return { status: 200, data: videos };
  }

  return { status: 400, data: { message: "Invalid search type" } };
};

const getPaginatedFeeds = async (query, page, limit) => {
  const feeds = await Video.paginate(query, {
    page,
    limit,
    populate: videoPopulate,
  });

  const feedsVideo = feeds.docs.map((video) => video.toObject());

  return {
    status: 200,
    data: {
      feeds: feedsVideo,
      totalDocs: feeds.totalDocs,
      totalPages: feeds.totalPages,
      currentPage: feeds.page,
      hasNextPage: feeds.hasNextPage,
      hasPrevPage: feeds.hasPrevPage,
      nextPage: feeds.nextPage,
      prevPage: feeds.prevPage,
    },
  };
};

const getPublicFeeds = async (userId, page, limit) => {
  const query = {
    $or: [{ visibility: "PUBLIC" }, { visibility: "PRIVATE", userId }],
    userId: { $ne: userId },
  };

  return await getPaginatedFeeds(query, page, limit);
};

const getFollowingFeeds = async (userId, page, limit) => {
  const user = await User.findById(userId);
  if (!user) {
    return { status: 404, data: { message: "User not found" } };
  }

  const query = {
    $or: [{ visibility: "PUBLIC" }, { visibility: "PRIVATE", userId }],
    userId: { $in: user.followings },
  };

  return await getPaginatedFeeds(query, page, limit);
};

module.exports = {
  searchContent,
  getPublicFeeds,
  getFollowingFeeds,
};
