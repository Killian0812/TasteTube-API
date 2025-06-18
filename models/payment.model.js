const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
    },
    status: {
      type: String,
      default: "initial",
      enum: ["initial", "paid", "failed"],
    },
    type: {
      type: String,
      enum: ["cash", "card", "vnpay"],
      default: "cash",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
