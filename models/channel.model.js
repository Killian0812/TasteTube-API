const mongoose = require("mongoose");
const { Schema } = mongoose;

const channelSchema = new Schema(
  {
    channelId: {
      type: String,
      required: true,
    },
    autoResponse: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Channel", channelSchema);
