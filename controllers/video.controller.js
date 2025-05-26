const videoService = require("../services/video.service");
const logger = require("../logger");

const getVideo = async (req, res) => {
  try {
    const video = await videoService.getVideo(req.params.videoId, req.userId);
    return res.status(200).json(video);
  } catch (error) {
    logger.info(error);
    if (
      error.message.includes("Private content") ||
      error.message.includes("Content for followers only")
    ) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

const getVideoInteraction = async (req, res) => {
  try {
    const totalInteractions = await videoService.getVideoInteraction(
      req.params.videoId,
      req.userId
    );
    return res.status(200).json(totalInteractions);
  } catch (error) {
    logger.error(error);
    if (error.message === "Can't find requested video") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

const getUserLikedVideos = async (req, res) => {
  try {
    const result = await videoService.getUserLikedVideos(req.userId);
    return res.status(200).json(result);
  } catch (e) {
    if (e.message === "No user found") {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: e.message });
  }
};

const getUserTargetedReviews = async (req, res) => {
  try {
    const { targetUserId, productId } = req.query;
    const result = await videoService.getUserTargetedReviews(
      targetUserId,
      productId
    );
    return res.status(200).json(result);
  } catch (e) {
    if (e.message === "No target user found") {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: e.message });
  }
};

const getVideoComments = async (req, res) => {
  try {
    const comments = await videoService.getVideoComments(
      req.params.videoId,
      req.userId
    );
    return res.status(200).json(comments);
  } catch (error) {
    if (error.message === "Can't find requested video") {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message.includes("Private content") ||
      error.message.includes("Content for followers only")
    ) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadVideo = async (req, res) => {
  try {
    const result = await videoService.uploadVideo(
      req.userId,
      req.file,
      req.body
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Invalid product IDs") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Internal Server Error")) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

const updateVideo = async (req, res) => {
  try {
    const result = await videoService.updateVideo(
      req.userId,
      req.params.videoId,
      req.body
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Invalid product IDs") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Internal Server Error")) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const result = await videoService.deleteVideo(
      req.params.videoId,
      req.userId
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Can't find requested video") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "You're not the owner of the video") {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

const commentVideo = async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;
    const comment = await videoService.commentVideo(
      req.params.videoId,
      req.userId,
      text,
      parentCommentId
    );
    return res.status(201).json(comment);
  } catch (error) {
    if (
      error.message === "Comment text is required" ||
      error.message === "Video not found"
    ) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const result = await videoService.deleteComment(commentId, req.userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Comment ID is required") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Unauthorized to delete comment") {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const likeVideo = async (req, res) => {
  try {
    const result = await videoService.likeVideo(req.params.videoId, req.userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Video not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const unlikeVideo = async (req, res) => {
  try {
    const result = await videoService.unlikeVideo(
      req.params.videoId,
      req.userId
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Video not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const shareVideo = async (req, res) => {
  try {
    const result = await videoService.shareVideo(
      req.params.videoId,
      req.userId
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Video not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const getVideos = async (req, res) => {
  try {
    const { page, limit, userId, status, visibility, search } = req.query;

    const result = await videoService.getVideos({
      page,
      limit,
      userId,
      status,
      visibility,
      search,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to retrieve videos",
    });
  }
};

const updateVideoStatus = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const video = await videoService.updateVideoStatus(videoId, status);

    return res.status(200).json(video);
  } catch (error) {
    const statusCode =
      error.message === "Video not found" || error.message === "Invalid status"
        ? 400
        : 500;
    return res.status(statusCode).json({
      message: error.message || "Failed to update video status",
    });
  }
};

module.exports = {
  getVideo,
  getVideoInteraction,
  uploadVideo,
  updateVideo,
  deleteVideo,
  commentVideo,
  getUserLikedVideos,
  getUserTargetedReviews,
  getVideoComments,
  deleteComment,
  likeVideo,
  unlikeVideo,
  shareVideo,
  getVideos,
  updateVideoStatus,
};
