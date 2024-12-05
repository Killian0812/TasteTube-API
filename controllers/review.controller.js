const Review = require("../models/review.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Comment = require("../models/reviewComment.model");
const ReviewLike = require("../models/reviewLike.model");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
} = require("../services/storage.service");

const getReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    if (!reviewId)
      return res.status(401).json({ message: "Please specify a review" });

    const review = await Review.findById(reviewId)
      .populate({
        path: "userId",
        select: "_id username image", // Get id, username and image of owner
      })
      .populate({
        path: "targetUserId",
        select: "_id username image", // Get id, username and image of target
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

    if (!review)
      return res.status(404).json({ message: "Can't find requested review" });

    const reviewJSON = {
      ...review.toObject(),
      userLiked: review.likes.some((like) => like.userId.equals(req.userId)),
    };

    const isOwner = review.userId.equals(req.userId);

    switch (review.visibility) {
      case "PRIVATE":
        if (!isOwner)
          return res.status(403).json({ message: "Private content" });
      case "FOLLOWERS_ONLY": {
        if (isOwner) return res.status(200).json(reviewJSON);
        const ownerFollowers = (await User.findById(review.userId)).followers;
        if (ownerFollowers.some((follower) => follower.equals(req.userId)))
          return res.status(200).json(reviewJSON);
        return res.status(403).json({ message: "Content for followers only" });
      }
      case "PUBLIC":
        return res.status(200).json(reviewJSON);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
};

const getReviewComments = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    if (!reviewId)
      return res.status(401).json({ message: "Please specify a review" });

    const review = await Review.findById(reviewId).populate({
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

    if (!review)
      return res.status(404).json({ message: "Can't find requested review" });

    const isOwner = review.userId.equals(req.userId);

    switch (review.visibility) {
      case "PRIVATE":
        if (!isOwner)
          return res.status(403).json({ message: "Private content" });
      case "FOLLOWERS_ONLY": {
        if (isOwner) return res.status(200).json(review.comments);
        const ownerFollowers = (await User.findById(review.userId)).followers;
        if (ownerFollowers.some((follower) => follower.equals(req.userId)))
          return res.status(200).json(review.comments);
        return res.status(403).json({ message: "Content for followers only" });
      }
      case "PUBLIC":
        return res.status(200).json(review.comments);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadReview = async (req, res) => {
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
    } = req.body;

    const targetUserId = req.params.targetUserId;
    if (!targetUserId)
      return res.status(400).json({ message: "Please specify a restaurant" });

    if (!user) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const file = req.file;
    if (!file) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const { url, filename } = await uploadToFirebaseStorage(file);

    const productIdList = JSON.parse(productIds);
    const validProducts = await Product.find()
      .where("_id")
      .in(productIdList)
      .exec();
    if (validProducts.length !== productIdList.length) {
      return res.status(400).json({ message: "Invalid product IDs" });
    }

    const review = new Review({
      userId: req.userId,
      targetUserId: targetUserId,
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
    review
      .save()
      .then(async (review) => {
        user.reviews.push(review._id);
        console.log(review._id);
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

const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    if (!reviewId)
      return res.status(401).json({ message: "Please specify a review" });

    const review = await Review.findById(reviewId);
    if (!review)
      return res.status(404).json({ message: "Can't find requested review" });

    if (!review.userId.equals(req.userId))
      return res
        .status(403)
        .json({ message: "You're not the owner of the review" });

    await deleteFromFirebaseStorage(review.filename);

    await Review.deleteOne({ _id: reviewId });

    const user = await User.findById(req.userId);
    const updatedReviews = user.reviews.filter((e) => !e._id.equals(reviewId));
    user.reviews = updatedReviews;
    await user.save();

    await ReviewLike.deleteMany({ reviewId });
    await Comment.deleteMany({ reviewId });

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const commentReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text, parentCommentId } = req.body;

    if (!text)
      return res.status(400).json({ message: "Comment text is required" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const comment = new Comment({
      userId: req.userId,
      reviewId,
      text,
      parentCommentId: parentCommentId ?? null,
    });

    await comment.save();

    review.comments.push(comment._id);
    await review.save();

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

    const review = await Review.findById(comment.reviewId);

    if (
      !comment.userId.equals(req.userId) ||
      !review.userId.equals(req.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete comment" });
    }

    await Review.updateOne(
      { _id: comment.reviewId },
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

const likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const existingLike = await ReviewLike.findOne({
      userId: req.userId,
      reviewId,
    });

    if (existingLike)
      return res.status(200).json({ message: "You already liked this review" });

    const like = new ReviewLike({
      userId: req.userId,
      reviewId,
    });

    await like.save();

    review.likes.push(like._id);
    await review.save();

    return res.status(201).json({
      message: "Review liked successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const unlikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const existingLike = await ReviewLike.findOne({
      userId: req.userId,
      reviewId,
    });

    if (!existingLike)
      return res
        .status(200)
        .json({ message: "You haven't liked this review yet" });

    await ReviewLike.deleteOne({
      _id: existingLike._id,
    });

    return res.status(200).json({
      message: "Review unliked successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports = {
  getReview,
  uploadReview,
  deleteReview,
  commentReview,
  getReviewComments,
  deleteComment,
  likeReview,
  unlikeReview,
};
