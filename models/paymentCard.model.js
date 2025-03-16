const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentCardSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["Visa", "Mastercard", "American Express", "Discover", "UnionPay"],
    required: true,
  },
  lastFour: { type: String, required: true, match: /^\d{4}$/ },
  holderName: { type: String, required: true },
  expiryDate: { type: String, required: true, match: /^\d{2}\/\d{2}$/ }, // MM/YY
  isDefault: { type: Boolean, default: false },
  encryptedData: { type: String, required: true }, // Simulated encryption
});

module.exports = mongoose.model("PaymentCard", paymentCardSchema);
