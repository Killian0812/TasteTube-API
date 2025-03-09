const mongoose = require("mongoose");
const { Schema } = mongoose;

const interactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    likes: {
      type: Number,
    },
    views: {
      type: Number,
    },
    bookmarked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interaction", interactionSchema);
