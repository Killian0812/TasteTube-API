const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");
const streamClient = require("../core/stream");
const { currencies } = require("../utils/constant");

const userSchema = new Schema(
  {
    phone: String,
    email: String,
    username: String,
    password: {
      type: String, // bcrypt needed
      required: true,
    },
    filename: String, // filename in storage
    image: String, // avatar url
    refreshToken: String,
    role: {
      type: String,
      enum: ["CUSTOMER", "RESTAURANT", "ADMIN"],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    bio: String,
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followings: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    videos: [
      // Future remove
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    currency: {
      type: String,
      enum: currencies,
      default: "VND",
    },
    fcmTokens: [
      {
        platform: {
          type: String,
        },
        token: {
          type: String,
        },
      },
    ],
    otp: {
      code: String, // bcrypt needed
      activatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.post("save", async function (doc) {
  const { id, username, image } = doc;
  try {
    await streamClient.upsertUser({
      id,
      name: username,
      image,
    });
  } catch (error) {
    console.error("Stream user upsert failed:", error.message);
  }
});

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("User", userSchema);
