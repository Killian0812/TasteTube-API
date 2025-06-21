const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");
const { getEmbedding } = require("../services/ai.service");
const { createVideoTranscoderJob } = require("../services/storage.service");
const Mux = require("@mux/mux-node");
const logger = require("../core/logger");

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

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
    embedding: {
      type: [Number],
      default: null,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    muxAssetId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

async function measureVideoDuration(doc) {
  try {
    if (doc.duration > 0) {
      logger.info(`Duration already set for video: ${doc._id}`);
      return;
    }
    const asset = await mux.video.assets.create({ input: doc.url });
    let assetDetails = await mux.video.assets.retrieve(asset.id);
    while (assetDetails.status !== "ready") {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      assetDetails = await mux.video.assets.retrieve(asset.id);
    }
    await doc
      .model("Video")
      .updateOne(
        { _id: doc._id },
        { $set: { duration: assetDetails.duration, muxAssetId: asset.id } }
      );
    logger.info(`Duration saved for video: ${doc._id}`);
  } catch (error) {
    logger.error(`Error getting duration for video: ${doc._id}`, error);
  }
}

async function generateVideoEmbedding(doc) {
  const text = [doc.title || "", doc.description || ""]
    .filter((t) => t.trim() !== "")
    .join(" ");

  if (!text) {
    logger.warn(`No text content to generate embedding for video: ${doc._id}`);
    return;
  }

  try {
    const embedding = await getEmbedding(text);
    await doc
      .model("Video")
      .updateOne({ _id: doc._id }, { $set: { embedding } });
    logger.info(`Embedding generated for video: ${doc._id}`);
  } catch (error) {
    logger.error(`Error generating embedding for video: ${doc._id}`, error);
  }
}

videoSchema.post("save", async function (doc, next) {
  try {
    if (doc.isNew) {
      await createVideoTranscoderJob(doc);
      await measureVideoDuration(doc);
    }
    await generateVideoEmbedding(doc);
  } catch (error) {
    logger.error(`Error executing hook for video: ${doc._id}`, error);
  }
  next();
});

videoSchema.plugin(mongoosePaginate);

videoSchema.index({ status: 1, visibility: 1, userId: 1, createdAt: -1 });
videoSchema.index({ createdAt: -1 });

const videoPopulate = [
  { path: "userId", select: "_id username image" },
  { path: "targetUserId", select: "_id username image" },
  {
    path: "products",
    populate: [
      { path: "category", select: "_id name" },
      { path: "userId", select: "_id image username phone" },
    ],
  },
];

module.exports = {
  Video: mongoose.model("Video", videoSchema),
  videoPopulate,
};
