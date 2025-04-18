const mongoose = require("mongoose");
const { Schema } = mongoose;

const discountSchema = new Schema({
  name: {
    type: String,
    required: [true, "Discount name is required"],
  },
  code: {
    type: String,
  },
  type: {
    type: String,
    enum: ["coupon", "voucher"],
    required: [true, "Discount type is required"],
  },
  value: {
    type: Number,
    required: [true, "Discount value is required"],
  },
  valueType: {
    type: String,
    enum: ["fixed", "percentage"],
    required: [true, "Value type (fixed or percentage) is required"],
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
    index: true,
  },
  minOrderAmount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "expired"],
    default: "active",
  },
});

// Validation: Ensure code is provided for coupon discounts and check expiration
discountSchema.pre("validate", async function (next) {
  if (this.type === "coupon" && !this.code) {
    next(new Error("Code is required for coupon discounts"));
  }
  // Validate percentage value (0–100)
  if (this.valueType === "percentage" && (this.value < 0 || this.value > 100)) {
    next(new Error("Percentage value must be between 0 and 100"));
  }
  // Set status to expired if endDate is in the past
  if (this.endDate && this.endDate < new Date() && this.status !== "inactive") {
    this.status = "expired";
  }
  // Ensure maxUses is greater than or equal to usesPerUser
  if (this.maxUses && this.usesPerUser) {
    if (this.maxUses < this.usesPerUser) {
      next(
        new Error("Max Uses must be greater than or equal to Uses per User")
      );
    }
  }
  // Check for existing coupon code with same shopId
  if (this.code) {
    try {
      const existingDiscount = await this.constructor.findOne({
        shopId: this.shopId,
        code: this.code,
        _id: { $ne: this._id }, // Exclude the current document
      });

      if (existingDiscount) {
        return next(
          new Error(
            `A discount with code "${this.code}" already exists for this shop`
          )
        );
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Discount", discountSchema);
