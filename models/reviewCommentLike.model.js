const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewCommentLikeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  commentId: {
    type: Schema.Types.ObjectId,
    ref: "ReviewComment",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ReviewCommentLike", reviewCommentLikeSchema);
