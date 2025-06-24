const User = require("../models/user.model");
const {
  Video,
  videoPopulate,
  videoAggregatePopulate,
} = require("../models/video.model");
const Interaction = require("../models/interaction.model");
const { getEmbedding } = require("../services/ai.service");
const { getValue, setValue } = require("../core/redis");

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
    ...videoAggregatePopulate,
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

const _getUserInteractions = async (userId) => {
  const cacheKey = `user_interactions:${userId}`;
  try {
    const cached = await getValue(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.error("Redis read error:", err.message);
  }

  const interactions = await Interaction.find({ userId });
  const result = {};
  for (const it of interactions) {
    result[it.videoId.toString()] = {
      likes: it.likes || 0,
      views: it.views || 0,
      watchTime: it.watchTime || 0,
      bookmarked: it.bookmarked || false,
    };
  }

  try {
    // Cache the result for 30 minutes
    await setValue(cacheKey, JSON.stringify(result), 1800);
  } catch (err) {
    console.error("Redis write error:", err.message);
  }

  return result;
};

const _getAvgEmbeddingOfUserLikedVideos = async (userId) => {
  const cacheKey = `avg_embedding_liked_videos:${userId}`;

  const cached = await getValue(cacheKey);
  if (cached) return JSON.parse(cached);

  const likedVideos = await Interaction.find({ userId, likes: { $gt: 0 } });
  const likedVideoIds = likedVideos.map((i) => i.videoId);
  const videos = await Video.find({ _id: { $in: likedVideoIds } });

  const embeddings = videos
    .map((v) => v.embedding)
    .filter((emb) => Array.isArray(emb));

  const avgEmbedding = embeddings.length
    ? embeddings[0].map(
        (_, i) =>
          embeddings.reduce((sum, vec) => sum + vec[i], 0) / embeddings.length
      )
    : null;

  try {
    // Cache the result for 30 minutes
    await setValue(cacheKey, JSON.stringify(avgEmbedding), 1800);
  } catch (err) {
    console.error("Redis write error:", err.message);
  }

  return avgEmbedding;
};

const _getActiveVideos = async (userId, followingIds) => {
  return await Video.aggregate([
    {
      $match: {
        status: "ACTIVE",
        $or: [
          { visibility: "PUBLIC" },
          { visibility: "FOLLOWERS_ONLY", userId: { $in: followingIds } },
        ],
        userId: { $ne: userId },
      },
    },
    ...videoAggregatePopulate,
  ]);
};

const _calculateContentSimilarity = (queryEmbedding, videos) => {
  if (!queryEmbedding) return [];

  const similarities = [];

  for (const video of videos) {
    if (video.embedding) {
      const dot = queryEmbedding.reduce(
        (acc, val, i) => acc + val * video.embedding[i],
        0
      );
      const magA = Math.sqrt(
        queryEmbedding.reduce((acc, val) => acc + val * val, 0)
      );
      const magB = Math.sqrt(
        video.embedding.reduce((acc, val) => acc + val * val, 0)
      );
      const cosineSim = dot / (magA * magB);
      similarities.push({ videoId: video._id.toString(), score: cosineSim });
    }
  }

  return similarities.sort((a, b) => b.score - a.score);
};

const _computeRecommendationScore = (video, interactions, similaritiesMap) => {
  const videoId = video._id.toString();

  const baseScore = video.views / (video.views + 100);

  const contentScore = similaritiesMap[videoId] || 0;

  const userInteraction = interactions[videoId] || {};
  const interactionScore =
    (userInteraction.likes || 0) * 0.4 +
    (userInteraction.views || 0) * 0.2 +
    (userInteraction.watchTime || 0) * 0.1 +
    (userInteraction.bookmarked ? 0.3 : 0.0);

  const daysSinceCreated =
    (Date.now() - new Date(video.createdAt)) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.max(0.1, 1.0 - daysSinceCreated / 30.0);

  return (
    (contentScore * 0.5 + interactionScore * 0.3 + baseScore * 0.2) * timeDecay
  );
};

const getRecommendedFeeds = async (userId, page = 1, limit = 10) => {
  const user = await User.findById(userId);
  if (!user) return { status: 404, data: { message: "User not found" } };

  const followingIds = user.followings || [];

  const [interactions, videos, avgEmbedding] = await Promise.all([
    _getUserInteractions(userId),
    _getActiveVideos(user._id, followingIds),
    _getAvgEmbeddingOfUserLikedVideos(userId),
  ]);

  const similarities = _calculateContentSimilarity(avgEmbedding, videos);
  const similaritiesMap = {};
  similarities.forEach((s) => {
    similaritiesMap[s.videoId] = s.score;
  });

  const scored = videos
    .map((video) => ({
      ...video,
      score: _computeRecommendationScore(video, interactions, similaritiesMap),
    }))
    .sort((a, b) => b.score - a.score);

  const start = (page - 1) * limit;
  const paginated = scored.slice(start, start + limit);

  return {
    status: 200,
    data: paginated,
  };
};

module.exports = {
  searchContent,
  getRecommendedFeeds,
  getFollowingFeeds,
};
