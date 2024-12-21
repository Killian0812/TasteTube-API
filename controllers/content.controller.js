const Video = require("../models/video.model");
const User = require("../models/user.model");

const search = async (req, res) => {
  try {
    const keyword = req.body.keyword;

    if (!keyword || keyword.trim() === "") {
      return res.status(200).json([]);
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

    return res.status(200).json(usersWithNoVideo);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getFeeds = async (req, res) => {
  try {
    const feeds = await Video.find({
      $or: [
        { visibility: "PUBLIC" },
        { visibility: "PRIVATE", userId: req.userId },
      ],
      userId: { $ne: req.userId }, // Exclude owned videos
    })
      .populate({
        path: "userId",
        select: "_id username image", // Get id, username and image of owner
      })
      .populate({
        path: "targetUserId",
        select: "_id username image", // Get id, username and image of target user
      })
      .populate({
        path: "likes",
        select: "_id userId", // Get id, userId owner
      })
      .populate({
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
      });

    const feedsWithUserLiked = feeds.map((video) => ({
      ...video.toObject(),
      userLiked: video.likes.some((like) => like.userId.equals(req.userId)),
    }));

    return res.status(200).json(feedsWithUserLiked);
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

module.exports = {
  search,
  getFeeds,
};
