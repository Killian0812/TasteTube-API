const mongoose = require("mongoose");
const { Schema } = mongoose;

const counterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

counterSchema.index({ _id: 1 });

module.exports = mongoose.model("Counter", counterSchema);
