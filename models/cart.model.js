const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "CartItem",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Can only change quantity or remove (When update with quantity 0)
const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      required: true,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
      alias: "qty",
    },
    cost: {
      type: Number,
    },
    currency: {
      type: String,
      enum: ["USD", "VND"],
      default: "VND",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  Cart: mongoose.model("Cart", cartSchema),
  CartItem: mongoose.model("CartItem", cartItemSchema),
};
