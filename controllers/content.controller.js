const Video = require("../models/video.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const VideoLike = require("../models/videoLike.model");

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
    //
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

module.exports = {
  search,
  getFeeds,
};
