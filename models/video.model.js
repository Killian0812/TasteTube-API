const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");
const { getEmbedding } = require("../services/ai.service");
const {
  createVideoTranscoderJob,
} = require("../services/storage.service");

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
  },
  {
    timestamps: true,
  }
);

videoSchema.post("save", async function (doc, next) {
  try {
    if (doc.isNew) {
      await createVideoTranscoderJob(doc);
    }
    const text = [doc.title || "", doc.description || ""]
      .filter((t) => t.trim() !== "")
      .join(" ");

    if (!text) {
      logger.warn(
        `No text content to generate embedding for video: ${doc._id}`
      );
      return next();
    }

    const embedding = await getEmbedding(text);
    doc.embedding = embedding;
    await doc.save();
    logger.info(`Embedding generated for video: ${doc._id}`);
  } catch (error) {
    logger.error(
      `Error generating video embedding for video: ${doc._id}`,
      error
    );
    next();
  }
});

videoSchema.plugin(mongoosePaginate);

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
