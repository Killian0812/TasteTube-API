const mongoose = require("mongoose");
const { Schema } = mongoose;
const { currencies } = require("../utils/constant");
const mongoosePaginate = require("mongoose-paginate-v2");

const userSchema = new Schema(
  {
    phone: String,
    email: String,
    username: String,
    password: {
      type: String,
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
    videos: [ // Future remove
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
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("User", userSchema);
