const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");
const { currencies } = require("../utils/constant");

const productSchema = new Schema(
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
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: currencies,
      default: "VND",
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
      alias: "qty",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    ship: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        filename: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    prepTime: {
      type: Number,
    },
    sizes: [
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
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(mongoosePaginate);

const productPopulate = [
  { path: "category", select: "_id name" },
  { path: "userId", select: "_id image username phone" },
];

module.exports = {
  Product: mongoose.model("Product", productSchema),
  productPopulate,
};
