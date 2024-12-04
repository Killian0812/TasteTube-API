const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewCommentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: "Review",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "ReviewCommentLike",
    },
  ],
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: "ReviewComment",
    default: null,
  },
  replies: [
    {
      type: Schema.Types.ObjectId,
      ref: "ReviewComment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ReviewComment", reviewCommentSchema);
