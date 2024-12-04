const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewLikeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ReviewLike", reviewLikeSchema);
