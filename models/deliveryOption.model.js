const mongoose = require("mongoose");
const { Schema } = mongoose;

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

module.exports = mongoose.model("DeliveryOption", deliveryOptionSchema);
