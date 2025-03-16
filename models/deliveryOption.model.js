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
    default: 0,
  },
  feePerKm: {
    type: Number,
    default: 0,
  },
  maxDistance: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("DeliveryOption", deliveryOptionSchema);
