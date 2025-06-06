const mongoose = require("mongoose");
const { Schema } = mongoose;

const deliveryStatus = [
  "ALLOCATING",
  "PENDING_PICKUP",
  "PICKING_UP",
  "PENDING_DROP_OFF",
  "IN_DELIVERY",
  "IN_RETURN",
  "RETURNED",
  "COMPLETED",
  "CANCELED",
  "FAILED",
];

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
        cost: {
          // base cost + size + toppings
          type: Number,
          min: 0,
        },
        size: {
          type: String,
          trim: true,
        },
        toppings: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },
            extraCost: {
              type: Number,
              default: 0,
              min: 0,
            },
          },
        ],
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPAY", "ZALOPAY", "CARD"],
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
    cancelReason: {
      type: String,
    },
    cancelBy: {
      type: String,
      enum: ["CUSTOMER", "RESTAURANT"],
    },
    notes: {
      type: String,
      // Optional note from customer
    },
    deliveryType: {
      type: String,
      enum: ["NONE", "SELF", "GRAB"],
    },
    deliveryStatusLog: [
      {
        deliveryStatus: {
          type: String,
          enum: deliveryStatus,
        },
        deliveryTimestamp: {
          type: Number,
        },
      },
    ],
    deliveryId: {
      type: String,
    },
    deliveryFee: {
      type: Number,
    },
    discounts: [
      {
        discountId: {
          type: Schema.Types.ObjectId,
          ref: "Discount",
        },
        amount: {
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

const orderPopulate = [
  {
    path: "items",
    populate: [
      {
        path: "product",
        populate: [
          {
            path: "category",
          },
          {
            path: "userId",
          },
        ],
      },
    ],
  },
  {
    path: "address",
  },
  {
    path: "userId",
    select: "_id phone email username image",
  },
  {
    path: "discounts.discountId",
  },
];

module.exports = {
  Order: mongoose.model("Order", orderSchema),
  orderPopulate: orderPopulate,
};
