const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
      alias: "lat",
    },
    longitude: {
      type: Number,
      required: true,
      alias: "lng",
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Address", addressSchema);
