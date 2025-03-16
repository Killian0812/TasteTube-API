const mongoose = require("mongoose");
const { Schema } = mongoose;
const { currencies } = require("../utils/constant");

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
      enum: ["CUSTOMER", "RESTAURANT"],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
