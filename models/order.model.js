const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNum: {
      type: Number,
      // Auto-increment on Trigger (prior to 'counters' collection)
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: String,
    },
    note: {
      type: String,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    paymentMethod: {
      type: String,
      // TODO: May add enum
    },
    paid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "DELIVERY", "COMPLELETED"],
      default: "PUBLIC",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
