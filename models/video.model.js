const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");

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
    views: {
      type: Number,
      default: 0,
    },
    jobId: {
      type: String,
    },
    manifestUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REMOVED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Video", videoSchema);
