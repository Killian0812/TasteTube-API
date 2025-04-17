const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["fixed", "percentage"],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  maxUses: {
    type: Number,
  },
  usesPerUser: {
    type: Number,
  },
  productIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  userUsages: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  ],
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  minOrderAmount: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Voucher = mongoose.model("Voucher", voucherSchema);

module.exports = Voucher;
