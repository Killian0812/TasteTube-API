const Video = require("../models/video.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const Interaction = require("../models/interaction.model");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
} = require("../services/storage.service");

const getVideo = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    if (!videoId)
      return res.status(401).json({ message: "Please specify a video" });

    const video = await Video.findById(videoId)
      .populate({
        path: "userId",
        select: "_id username image", // Get id, username and image of owner
      })
      .populate({
        path: "targetUserId",
        select: "_id username image", // Get id, username and image of target user
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

    if (!video)
      return res.status(404).json({ message: "Can't find requested video" });

    const videoJSON = video.toObject();

    const isOwner = video.userId.equals(req.userId);

    switch (video.visibility) {
      case "PRIVATE":
        if (!isOwner)
          return res.status(403).json({ message: "Private content" });
      case "FOLLOWERS_ONLY": {
        if (isOwner) return res.status(200).json(videoJSON);
        const ownerFollowers = (await User.findById(video.userId)).followers;
        if (ownerFollowers.some((follower) => follower.equals(req.userId)))
          return res.status(200).json(videoJSON);
        return res.status(403).json({ message: "Content for followers only" });
      }
      case "PUBLIC":
        return res.status(200).json(videoJSON);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
};

const getUserLikedVideos = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(400).json({ message: "No user found" });
  }

  try {
    const userInteracts = await Interaction.find({ userId: userId }).populate({
      path: "videoId",
      populate: [
        {
          path: "userId",
          select: "_id username image", // Populate userId with id, username, and image
        },
        {
          path: "targetUserId",
          select: "_id username image", // Populate targetUserId with id, username, and image
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
    });

    const videos = userInteracts.map((e) => e.videoId);

    return res.status(200).json({
      videos,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const getUserTargetedReviews = async (req, res) => {
  const targetUserId = req.query.targetUserId;
  if (!targetUserId) {
    return res.status(400).json({ message: "No target user found" });
  }

  try {
    const userTargetedReviews = await Video.find({
      targetUserId: targetUserId,
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

    return res.status(200).json({
      videos: userTargetedReviews,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const getVideoComments = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    if (!videoId)
      return res.status(401).json({ message: "Please specify a video" });

    const video = await Video.findById(videoId);

    if (!video)
      return res.status(404).json({ message: "Can't find requested video" });

    const isOwner = video.userId.equals(req.userId);

    const comments = await Comment.find({
      videoId: videoId,
      parentCommentId: null,
    }).populate([
      {
        path: "userId",
        select: "_id username image", // Get id, username and image of commenter
      },
      {
        path: "replies", // Populate replies
        populate: {
          path: "userId",
          select: "_id username image",
        },
      },
    ]);

    switch (video.visibility) {
      case "PRIVATE":
        if (!isOwner)
          return res.status(403).json({ message: "Private content" });
      case "FOLLOWERS_ONLY": {
        if (isOwner) return res.status(200).json(comments);
        const ownerFollowers = (await User.findById(video.userId)).followers;
        if (ownerFollowers.some((follower) => follower.equals(req.userId)))
          return res.status(200).json(comments);
        return res.status(403).json({ message: "Content for followers only" });
      }
      case "PUBLIC":
        return res.status(200).json(comments);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadVideo = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const {
      title,
      description,
      productIds,
      hashtags,
      direction,
      thumbnail,
      visibility,
      targetUserId,
    } = req.body;

    if (!user) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const file = req.file;
    if (!file) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const { url, filename } = await uploadToFirebaseStorage(file);

    const productIdList = JSON.parse(productIds);
    const validProducts = await Product.find().where("_id").in(productIdList);

    if (validProducts.length !== productIdList.length) {
      return res.status(400).json({ message: "Invalid product IDs" });
    }

    const video = new Video({
      userId: req.userId,
      url: url,
      filename: filename,
      direction: direction,
      title: title,
      description: description,
      hashtags: JSON.parse(hashtags),
      thumbnail: thumbnail,
      products: validProducts.map((p) => p._id),
      visibility: visibility,
    });

    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) video.targetUserId = targetUser._id;
    }

    video
      .save()
      .then(async (video) => {
        user.videos.push(video._id);
        console.log(video._id);
        await user.save();
        return res.status(200).json({
          message: "Uploaded",
        });
      })
      .catch((e) => {
        return res.status(500).json({
          message: e,
        });
      });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    if (!videoId)
      return res.status(401).json({ message: "Please specify a video" });

    const video = await Video.findById(videoId);
    if (!video)
      return res.status(404).json({ message: "Can't find requested video" });

    if (!video.userId.equals(req.userId))
      return res
        .status(403)
        .json({ message: "You're not the owner of the video" });

    await deleteFromFirebaseStorage(video.filename);

    await Video.deleteOne({ _id: videoId });

    const user = await User.findById(req.userId);
    const updatedVideos = user.videos.filter((e) => !e._id.equals(videoId));
    user.videos = updatedVideos;
    await user.save();

    await Interaction.deleteMany({ videoId });
    await Comment.deleteMany({ videoId });

    return res.status(200).json({
      message: "Video deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const commentVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { text, parentCommentId } = req.body;

    if (!text)
      return res.status(400).json({ message: "Comment text is required" });

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const comment = new Comment({
      userId: req.userId,
      videoId,
      text,
      parentCommentId: parentCommentId ?? null,
    });

    await comment.save();

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      parentComment.replies.push(comment._id);
      await parentComment.save();
    }

    const commentJSON = (
      await comment.populate({
        path: "userId",
        select: "_id username image", // Get id, username and image of owner
      })
    ).toObject();

    return res.status(201).json(commentJSON);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;

    if (!commentId)
      return res.status(400).json({ message: "Comment ID is required" });

    const comment = await Comment.findById(commentId);

    if (!comment) return res.status(200).json({ message: "Comment not found" });

    if (!comment.userId.equals(req.userId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete comment" });
    }

    if (comment.parentCommentId)
      await Comment.updateOne(
        { _id: comment.parentCommentId },
        { $pull: { replies: comment._id } }
      );

    await Comment.deleteMany({
      _id: { $in: comment.replies },
    });

    await Comment.deleteOne({ _id: commentId });

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const likeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    await Interaction.findOneAndUpdate(
      { userId: req.userId, videoId },
      { $inc: { likes: 1 } },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "Video liked successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const unlikeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const existingInteract = await Interaction.findOne({
      userId: req.userId,
      videoId,
    });

    if (!existingInteract)
      return res
        .status(200)
        .json({ message: "You haven't liked this video yet" });

    existingInteract.likes = 0;
    await existingInteract.save();

    return res.status(200).json({
      message: "Video unliked successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports = {
  getVideo,
  uploadVideo,
  deleteVideo,
  commentVideo,
  getUserLikedVideos,
  getUserTargetedReviews,
  getVideoComments,
  deleteComment,
  likeVideo,
  unlikeVideo,
};
