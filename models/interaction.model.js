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
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    shared: {
      type: Boolean,
      default: false,
    },
    bookmarked: {
      type: Boolean,
      default: false,
    },
    watchTime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

interactionSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model("Interaction", interactionSchema);
