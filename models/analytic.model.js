const mongoose = require("mongoose");
const { Schema } = mongoose;
const { currencies } = require("../utils/constant");

const productSalesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  sales: {
    type: Number,
    required: true,
    min: 0,
  },
  revenue: {
    type: Number,
    required: true,
    min: 0,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
});

const categorySalesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  sales: {
    type: Number,
    required: true,
    min: 0,
  },
  revenue: {
    type: Number,
    required: true,
    min: 0,
  },
  growth: {
    type: Number,
    required: true,
  },
});

const paymentMethodSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
    min: 0,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
});

const analyticsSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalRevenue: {
      type: Number,
      required: true,
      min: 0,
    },
    orderCount: {
      type: Number,
      required: true,
      min: 0,
    },
    averageOrderValue: {
      type: Number,
      required: true,
      min: 0,
    },
    dailySales: {
      type: Map,
      of: Number,
      required: true,
      default: {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
      },
    },
    videoViews: {
      type: Number,
      required: true,
      min: 0,
    },
    positiveReviews: {
      type: Number,
      required: true,
      min: 0,
    },
    neutralReviews: {
      type: Number,
      required: true,
      min: 0,
    },
    negativeReviews: {
      type: Number,
      required: true,
      min: 0,
    },
    topProducts: {
      type: [productSalesSchema],
      required: true,
      default: [],
    },
    topCategories: {
      type: [categorySalesSchema],
      required: true,
      default: [],
    },
    conversionRate: {
      type: Number,
      required: true,
      min: 0,
    },
    returningCustomers: {
      type: Number,
      required: true,
      min: 0,
    },
    newCustomers: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethods: {
      type: [paymentMethodSchema],
      required: true,
      default: [],
    },
    currency: {
      type: String,
      enum: currencies,
      default: "VND",
    },
  },
  {
    timestamps: true,
  }
);

analyticsSchema.index({ shopId: 1, date: 1 });

module.exports = mongoose.model("Analytic", analyticsSchema);
