const { Video, videoPopulate } = require("../models/video.model");
const { Product } = require("../models/product.model");
const User = require("../models/user.model");
const { Comment, commentPopulate } = require("../models/comment.model");
const Interaction = require("../models/interaction.model");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
  getVideoTranscoderJob,
} = require("../services/storage.service");
const logger = require("../core/logger");

const getVideo = async (videoId, userId) => {
  if (!videoId) {
    throw new Error("Please specify a video");
  }

  const video = await Video.findById(videoId).populate(videoPopulate);

  if (!video) {
    throw new Error("Can't find requested video");
  }

  setImmediate(async () => {
    await getVideoTranscoderJob(video);
  });

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

  setImmediate(async () => {
    await incrementVideoView(video, userId);
  });
  return video;
};

const getVideoInteraction = async (videoId, userId) => {
  if (!videoId) {
    throw new Error("Please specify a video");
  }

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

  return totalInteractions;
};

const incrementVideoView = async (video, userId) => {
  if (!userId) return;
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
    populate: videoPopulate,
  });

  const videos = userInteracts
    .map((e) => e.videoId)
    .filter((video, index, self) => video && self.indexOf(video) === index);

  return videos;
};

const getUserVideos = async (userId, requestUserId) => {
  if (!userId) {
    throw new Error("No user found");
  }

  const videos = await Video.find({ userId })
    .sort({ createdAt: -1 })
    .populate(videoPopulate);

  const user = await User.findById(userId);
  const isFollower = user.followers.some((follower) =>
    follower.equals(requestUserId)
  );

  const visibleVideos = videos.filter((video) => {
    let canView = false;
    if (video.visibility === "PRIVATE") {
      canView = video.userId.equals(requestUserId);
    } else if (video.visibility === "FOLLOWERS_ONLY") {
      canView = video.userId.equals(requestUserId) || isFollower;
    } else {
      canView = true;
    }
    return canView;
  });

  return visibleVideos;
};

const getUserTargetedReviews = async (targetUserId, productId) => {
  if (!targetUserId) {
    throw new Error("No target user found");
  }

  // Products must contain the productId if provided
  const userTargetedReviews = await Video.find({
    targetUserId: targetUserId,
    ...(productId ? { products: productId } : {}),
  }).populate(videoPopulate);

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
    commentPopulate,
    {
      path: "replies",
      populate: commentPopulate,
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
    targetUserId,
  });

  return { message: "Uploaded" };
};

const updateVideo = async (userId, videoId, body) => {
  const { title, description, productIds, hashtags, visibility } = body;

  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === "SUSPENDED") {
    throw new Error("You have been suspended from updating content");
  }

  // Validate video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  if (video.userId.toString() !== userId) {
    throw new Error("Unauthorized to update this video");
  }

  // Validate product IDs if provided
  if (productIds) {
    const productIdList = JSON.parse(productIds);
    const validProducts = await Product.find().where("_id").in(productIdList);

    if (validProducts.length !== productIdList.length) {
      throw new Error("Invalid product IDs");
    }
    video.products = validProducts.map((p) => p._id);
  }

  // Update fields if provided
  if (title) video.title = title;
  if (description) video.description = description;
  if (hashtags) video.hashtags = JSON.parse(hashtags);
  if (visibility) video.visibility = visibility;

  // Save updated video
  await video.save();

  // Populate video for response
  const populatedVideo = await Video.findById(videoId).populate(videoPopulate);

  return { message: "Video updated", video: populatedVideo };
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

  const populatedComment = await comment.populate(commentPopulate);

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

const getVideos = async ({
  page,
  limit,
  userId,
  status,
  visibility,
  search,
}) => {
  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    select: "-__v", // Exclude version key
    sort: { createdAt: -1 }, // Sort by newest first
    populate: videoPopulate,
  };

  const query = {};

  // Apply filters
  if (userId) {
    query.userId = userId;
  }
  if (status) {
    query.status = status;
  }
  if (visibility) {
    query.visibility = visibility;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const result = await Video.paginate(query, options);

  return {
    videos: result.docs,
    totalDocs: result.totalDocs,
    limit: result.limit,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    page: result.page,
    totalPages: result.totalPages,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  };
};

const updateVideoStatus = async (videoId, newStatus) => {
  if (!videoId) {
    throw new Error("No video found");
  }

  const video = await Video.findById(videoId).populate(videoPopulate);
  if (!video) {
    throw new Error("Video not found");
  }

  video.status = newStatus;
  await video.save();

  return video;
};

module.exports = {
  getVideo,
  getVideoInteraction,
  incrementVideoView,
  getUserVideos,
  getUserLikedVideos,
  getUserTargetedReviews,
  getVideoComments,
  uploadVideo,
  updateVideo,
  deleteVideo,
  commentVideo,
  deleteComment,
  likeVideo,
  unlikeVideo,
  shareVideo,
  getVideos,
  updateVideoStatus,
};
