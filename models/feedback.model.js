const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");
const { Product } = require("./product.model");

const feedbackSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    feedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.plugin(mongoosePaginate);

async function recalculateAverageRating(productId) {
  const result = await mongoose.model("Feedback").aggregate([
    { $match: { productId: productId } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const avgRating = result[0]?.avgRating || 0;
  await Product.findByIdAndUpdate(productId, { avgRating });
}

feedbackSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    await recalculateAverageRating(doc.productId);
  }
});

const feedbackPopulate = {
  path: "userId",
  select: "_id image username phone",
};

module.exports = {
  Feedback: mongoose.model("Feedback", feedbackSchema),
  feedbackPopulate,
};
