const Video = require("../models/video.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const VideoLike = require("../models/videoLike.model");
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
        path: "likes",
        select: "_id userId", // Get id, userId owner
      })
      .populate({
        path: "products",
        populate: {
          path: "category",
        },
      });

    if (!video)
      return res.status(404).json({ message: "Can't find requested video" });

    video.views++;
    video.save();

    const videoJSON = {
      ...video.toObject(),
      userLiked: video.likes.some((like) => like.userId.equals(req.userId)),
    };

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
    const videoLikes = await VideoLike.find({ userId: userId }).populate({
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
          populate: {
            path: "category",
          },
        },
      ],
    });

    const videosWithUserLiked = videoLikes.map((videoLike) => {
      const video = videoLike.videoId;
      return {
        ...video.toObject(),
        userLiked: true,
      };
    });

    return res.status(200).json({
      videos: videosWithUserLiked,
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
            select: "_id image username",
          },
        ],
      });

    const reviewsWithUserLiked = userTargetedReviews.map((review) => {
      return {
        ...review.toObject(),
        userLiked: review.likes.some((like) => like.userId.equals(req.userId)),
      };
    });

    return res.status(200).json({
      videos: reviewsWithUserLiked,
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

    const video = await Video.findById(videoId).populate({
      path: "comments",
      match: { parentCommentId: null },
      populate: [
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
      ],
    });

    if (!video)
      return res.status(404).json({ message: "Can't find requested video" });

    const isOwner = video.userId.equals(req.userId);

    switch (video.visibility) {
      case "PRIVATE":
        if (!isOwner)
          return res.status(403).json({ message: "Private content" });
      case "FOLLOWERS_ONLY": {
        if (isOwner) return res.status(200).json(video.comments);
        const ownerFollowers = (await User.findById(video.userId)).followers;
        if (ownerFollowers.some((follower) => follower.equals(req.userId)))
          return res.status(200).json(video.comments);
        return res.status(403).json({ message: "Content for followers only" });
      }
      case "PUBLIC":
        return res.status(200).json(video.comments);
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

    await VideoLike.deleteMany({ videoId });
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

    video.comments.push(comment._id);
    await video.save();

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

    const video = await Video.findById(comment.videoId);

    if (
      !comment.userId.equals(req.userId) ||
      !video.userId.equals(req.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete comment" });
    }

    await Video.updateOne(
      { _id: comment.videoId },
      { $pull: { comments: comment._id } }
    );

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

    const existingLike = await VideoLike.findOne({
      userId: req.userId,
      videoId,
    });

    if (existingLike)
      return res.status(200).json({ message: "You already liked this video" });

    const like = new VideoLike({
      userId: req.userId,
      videoId,
    });

    await like.save();

    video.likes.push(like._id);
    await video.save();

    return res.status(201).json({
      message: "Video liked successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const unlikeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const existingLike = await VideoLike.findOne({
      userId: req.userId,
      videoId,
    });

    if (!existingLike)
      return res
        .status(200)
        .json({ message: "You haven't liked this video yet" });

    await VideoLike.deleteOne({
      _id: existingLike._id,
    });

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
