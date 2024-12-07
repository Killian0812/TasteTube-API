const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ["FRONT", "BACK"],
    },
    title: {
      type: String,
      trim: true,
    },
    description: String,
    thumbnail: String,
    hashtags: [String],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "VideoLike",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    visibility: {
      type: String,
      enum: ["PRIVATE", "FOLLOWERS_ONLY", "PUBLIC"],
      default: "PUBLIC",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", videoSchema);
