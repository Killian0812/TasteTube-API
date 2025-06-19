const mongoose = require("mongoose");
const { Schema } = mongoose;
const { Product } = require("./product.model");
const Address = require("./address.model");
const logger = require("../core/logger");

const deliveryOptionSchema = new Schema({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  freeDistance: {
    type: Number,
    default: 1,
  },
  feePerKm: {
    type: Number,
    default: 10000,
  },
  maxDistance: {
    type: Number,
    default: 15,
  },
  address: {
    type: Schema.Types.ObjectId,
    ref: "Address",
  },
});

deliveryOptionSchema.index({ shopId: 1 }, { unique: true });

deliveryOptionSchema.post("findOneAndUpdate", async function (doc) {
  try {
    if (!doc.address) return;

    const address = await Address.findById(doc.address);
    if (!address) return;

    await Product.updateMany(
      { userId: doc.shopId },
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [address.longitude, address.latitude],
          },
        },
      }
    );
  } catch (error) {
    logger.error(
      "Failed to update product locations after DeliveryOption save:",
      error
    );
  }
});

module.exports = mongoose.model("DeliveryOption", deliveryOptionSchema);
