const Video = require("../models/video.model");
const User = require("../models/user.model");
const { searchUsers, searchVideos } = require("../services/content.service");

const search = async (req, res) => {
  try {
    const { keyword, type } = req.query;
    if (type === "user") {
      const users = await searchUsers(keyword);
      return res.status(200).json(users);
    }
    if (type === "video") {
      const videos = await searchVideos(keyword, req.userId);
      return res.status(200).json(videos);
    }
    return res.status(400).json({ message: "Invalid search" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getFeeds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const feeds = await Video.paginate(
      {
        $or: [
          { visibility: "PUBLIC" },
          { visibility: "PRIVATE", userId: req.userId },
        ],
        userId: { $ne: req.userId }, // Exclude owned videos
      },
      {
        page,
        limit,
        populate: [
          {
            path: "userId",
            select: "_id username image", // Get id, username and image of owner
          },
          {
            path: "targetUserId",
            select: "_id username image", // Get id, username and image of target user
          },
          {
            path: "products",
            populate: [
              {
                path: "category",
                select: "_id name",
              },
              {
                path: "userId",
                select: "_id image username phone",
              },
            ],
          },
        ],
      }
    );

    const feedsVideo = feeds.docs.map((video) => video.toObject());

    return res.status(200).json({
      feeds: feedsVideo,
      totalDocs: feeds.totalDocs, // Total number of videos
      totalPages: feeds.totalPages, // Total number of pages
      currentPage: feeds.page, // Current page number
      hasNextPage: feeds.hasNextPage, // If there is a next page
      hasPrevPage: feeds.hasPrevPage, // If there is a previous page
      nextPage: feeds.nextPage, // Next page number (if exists)
      prevPage: feeds.prevPage, // Previous page number (if exists)
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

const getFollowingFeeds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(req.userId);
    const feeds = await Video.paginate(
      {
        $or: [
          { visibility: "PUBLIC" },
          { visibility: "PRIVATE", userId: req.userId },
        ],
        userId: { $in: user.followings }, // Get videos from following users
      },
      {
        page,
        limit,
        populate: [
          {
            path: "userId",
            select: "_id username image", // Get id, username and image of owner
          },
          {
            path: "targetUserId",
            select: "_id username image", // Get id, username and image of target user
          },
          {
            path: "products",
            populate: [
              {
                path: "category",
                select: "_id name",
              },
              {
                path: "userId",
                select: "_id image username phone",
              },
            ],
          },
        ],
      }
    );

    const feedsVideo = feeds.docs.map((video) => video.toObject());

    return res.status(200).json({
      feeds: feedsVideo,
      totalDocs: feeds.totalDocs, // Total number of videos
      totalPages: feeds.totalPages, // Total number of pages
      currentPage: feeds.page, // Current page number
      hasNextPage: feeds.hasNextPage, // If there is a next page
      hasPrevPage: feeds.hasPrevPage, // If there is a previous page
      nextPage: feeds.nextPage, // Next page number (if exists)
      prevPage: feeds.prevPage, // Previous page number (if exists)
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

module.exports = {
  search,
  getFeeds,
  getFollowingFeeds,
};
