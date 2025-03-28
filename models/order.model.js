const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    userId: {
      // Customer
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopId: {
      // Shop
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNum: {
      type: Number,
      // Auto-increment on Trigger (prior to 'counters' collection)
    },
    orderId: {
      type: String,
      // YYYYMMDD-orderNum
    },
    trackingId: {
      type: String,
      required: true,
      // Random string of 6 characters
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
    },
    note: {
      type: String,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    paymentMethod: {
      type: String,
      // TODO: May add enum
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "DELIVERY", "COMPLETED", "CANCELED"],
      default: "PENDING",
    },
    notes: {
      type: String,
      // Optional note from customer
    },
    deliveryStatusLog: [
      {
        deliveryStatus: {
          type: String,
          enum: [], // TODO:
        },
        deliveryTimestamp: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// on validation, before saving
orderSchema.pre("validate", async function (next) {
  const order = this;

  if (!order.isNew) return next();

  try {
    order.trackingId = Math.random().toString(36).substring(2, 8).toUpperCase();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Order", orderSchema);
