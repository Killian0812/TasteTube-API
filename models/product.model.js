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
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(mongoosePaginate);

productSchema.index({ category: 1 });
productSchema.index({ userId: 1 });
productSchema.index({ location: "2dsphere" });

productSchema.pre("save", async function (next) {
  if (this.location?.coordinates?.length === 2) return next();

  try {
    const DeliveryOption = mongoose.model("DeliveryOption");
    const Address = mongoose.model("Address");

    let address;

    const deliveryOption = await DeliveryOption.findOne({
      shopId: this.userId,
    }).lean();
    if (deliveryOption?.address) {
      address = await Address.findById(deliveryOption.address).lean();
    }
    if (!address) {
      address = await Address.findOne({ userId: this.userId })
        .sort({ createdAt: 1 })
        .lean();
    }

    if (address && address.longitude != null && address.latitude != null) {
      this.location = {
        type: "Point",
        coordinates: [address.longitude, address.latitude],
      };
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

const productPopulate = [
  { path: "category", select: "_id name" },
  { path: "userId", select: "_id image username phone" },
];

const productAggregatePopulate = [
  {
    $lookup: {
      from: "categories",
      let: { catId: "$category" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$catId"] } } },
        { $project: { _id: 1, name: 1 } },
      ],
      as: "category",
    },
  },
  { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "users",
      let: { uid: "$userId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
        { $project: { _id: 1, image: 1, username: 1, phone: 1 } },
      ],
      as: "userId",
    },
  },
  { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
];

module.exports = {
  Product: mongoose.model("Product", productSchema),
  productPopulate,
  productAggregatePopulate,
};
