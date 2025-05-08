const Video = require("../models/video.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const Interaction = require("../models/interaction.model");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
  createVideoTranscoderJob,
  getVideoTranscoderJob,
} = require("../services/storage.service");
const logger = require("../logger");

const getVideo = async (videoId, userId) => {
  if (!videoId) {
    throw new Error("Please specify a video");
  }

  const video = await Video.findById(videoId)
    .populate({
      path: "userId",
      select: "_id username image",
    })
    .populate({
      path: "targetUserId",
      select: "_id username image",
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

  if (!video) {
    throw new Error("Can't find requested video");
  }

  setImmediate(async () => {
    await getVideoTranscoderJob(video);
  });

  const interactions = await Interaction.find({ videoId: videoId });
  const totalInteractions = interactions.reduce(
    (acc, interaction) => {
      if (interaction.likes > 0) acc.totalLikes += 1;
      acc.totalViews += interaction.views;
      if (interaction.shared) acc.totalShares += 1;
      if (interaction.bookmarked) acc.totalBookmarked += 1;
      if (interaction.userId.equals(userId) && interaction.likes > 0)
        acc.userLiked = true;
      return acc;
    },
    {
      videoId: videoId,
      totalLikes: 0,
      totalViews: 0,
      totalShares: 0,
      totalBookmarked: 0,
      userLiked: false,
    }
  );

  const isOwner = video.userId.equals(userId);
  let canView = false;

  switch (video.visibility) {
    case "PRIVATE":
      canView = isOwner;
      break;
    case "FOLLOWERS_ONLY":
      if (isOwner) {
        canView = true;
      } else {
        const ownerFollowers = (await User.findById(video.userId)).followers;
        canView = ownerFollowers.some((follower) => follower.equals(userId));
      }
      break;
    case "PUBLIC":
      canView = true;
      break;
  }

  if (!canView) {
    throw new Error(
      video.visibility === "PRIVATE"
        ? "Private content"
        : "Content for followers only"
    );
  }

  await incrementVideoView(video, userId);
  return totalInteractions;
};

const incrementVideoView = async (video, userId) => {
  video.views++;
  try {
    await Promise.all([
      Interaction.findOneAndUpdate(
        { userId: userId, videoId: video.id },
        { $inc: { views: 1 } },
        { upsert: true, new: true }
      ),
      video.save(),
    ]);
    logger.info(`Views incremented ${video.id}`);
  } catch (error) {
    logger.error(
      `Error updating interaction or saving video ${video.id}`,
      error
    );
    throw error;
  }
};

const getUserLikedVideos = async (userId) => {
  if (!userId) {
    throw new Error("No user found");
  }

  const userInteracts = await Interaction.find({
    userId: userId,
    likes: { $gt: 0 },
  }).populate({
    path: "videoId",
    populate: [
      {
        path: "userId",
        select: "_id username image",
      },
      {
        path: "targetUserId",
        select: "_id username image",
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

  const videos = userInteracts
    .map((e) => e.videoId)
    .filter((video, index, self) => video && self.indexOf(video) === index);

  return { videos };
};

const getUserTargetedReviews = async (targetUserId) => {
  if (!targetUserId) {
    throw new Error("No target user found");
  }

  const userTargetedReviews = await Video.find({
    targetUserId: targetUserId,
  })
    .populate({
      path: "userId",
      select: "_id username image",
    })
    .populate({
      path: "targetUserId",
      select: "_id username image",
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

  return { videos: userTargetedReviews };
};

const getVideoComments = async (videoId, userId) => {
  if (!videoId) {
    throw new Error("Please specify a video");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Can't find requested video");
  }

  const isOwner = video.userId.equals(userId);
  let canView = false;

  switch (video.visibility) {
    case "PRIVATE":
      canView = isOwner;
      break;
    case "FOLLOWERS_ONLY":
      if (isOwner) {
        canView = true;
      } else {
        const ownerFollowers = (await User.findById(video.userId)).followers;
        canView = ownerFollowers.some((follower) => follower.equals(userId));
      }
      break;
    case "PUBLIC":
      canView = true;
      break;
  }

  if (!canView) {
    throw new Error(
      video.visibility === "PRIVATE"
        ? "Private content"
        : "Content for followers only"
    );
  }

  const comments = await Comment.find({
    videoId: videoId,
    parentCommentId: null,
  }).populate([
    {
      path: "userId",
      select: "_id username image",
    },
    {
      path: "replies",
      populate: {
        path: "userId",
        select: "_id username image",
      },
    },
  ]);

  return comments;
};

const uploadVideo = async (userId, file, body) => {
  const {
    title,
    description,
    productIds,
    hashtags,
    direction,
    thumbnail,
    visibility,
    targetUserId,
  } = body;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Internal Server Error");
  }

  if (user.status === "SUSPENDED") {
    throw new Error("You have been suspended from uploading new content");
  }

  if (!file) {
    throw new Error("Internal Server Error");
  }

  const { url, filename } = await uploadToFirebaseStorage(file);

  const productIdList = JSON.parse(productIds);
  const validProducts = await Product.find().where("_id").in(productIdList);

  if (validProducts.length !== productIdList.length) {
    throw new Error("Invalid product IDs");
  }

  const video = await Video.create({
    userId: userId,
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
    if (targetUser) {
      video.targetUserId = targetUser._id;
    }
  }

  setImmediate(async () => {
    user.videos.push(video._id);
    await user.save();
    await createVideoTranscoderJob(video);
  });

  return { message: "Uploaded" };
};

const deleteVideo = async (videoId, userId) => {
  if (!videoId) {
    throw new Error("Please specify a video");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Can't find requested video");
  }

  if (!video.userId.equals(userId)) {
    throw new Error("You're not the owner of the video");
  }

  await deleteFromFirebaseStorage(video.filename);

  await Video.deleteOne({ _id: videoId });

  const user = await User.findById(userId);
  const updatedVideos = user.videos.filter((e) => !e._id.equals(videoId));
  user.videos = updatedVideos;
  await user.save();

  await Interaction.deleteMany({ videoId });
  await Comment.deleteMany({ videoId });

  return { message: "Video deleted successfully" };
};

const commentVideo = async (videoId, userId, text, parentCommentId) => {
  if (!text) {
    throw new Error("Comment text is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  const comment = new Comment({
    userId: userId,
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

  const populatedComment = await comment.populate({
    path: "userId",
    select: "_id username image",
  });

  return populatedComment.toObject();
};

const deleteComment = async (commentId, userId) => {
  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return { message: "Comment not found" };
  }

  if (!comment.userId.equals(userId)) {
    throw new Error("Unauthorized to delete comment");
  }

  if (comment.parentCommentId) {
    await Comment.updateOne(
      { _id: comment.parentCommentId },
      { $pull: { replies: comment._id } }
    );
  }

  await Comment.deleteMany({
    _id: { $in: comment.replies },
  });

  await Comment.deleteOne({ _id: commentId });

  return { message: "Comment deleted successfully" };
};

const likeVideo = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  await Interaction.findOneAndUpdate(
    { userId: userId, videoId },
    { $inc: { likes: 1 } },
    { upsert: true, new: true }
  );

  return { message: "Video liked successfully" };
};

const unlikeVideo = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  const existingInteract = await Interaction.findOne({
    userId: userId,
    videoId,
  });

  if (!existingInteract) {
    return { message: "You haven't liked this video yet" };
  }

  existingInteract.likes = 0;
  await existingInteract.save();

  return { message: "Video unliked successfully" };
};

const shareVideo = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  await Interaction.findOneAndUpdate(
    { userId: userId, videoId },
    { $set: { shared: true } },
    { upsert: true, new: true }
  );

  return { message: "Video shared successfully" };
};

module.exports = {
  getVideo,
  incrementVideoView,
  getUserLikedVideos,
  getUserTargetedReviews,
  getVideoComments,
  uploadVideo,
  deleteVideo,
  commentVideo,
  deleteComment,
  likeVideo,
  unlikeVideo,
  shareVideo,
};
