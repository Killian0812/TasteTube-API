const Discount = require("../models/discount.model");

const createDiscount = async (discountData) => {
  const discount = new Discount(discountData);
  return await discount.save();
};

const getDiscountByCode = async (code) => {
  return await Discount.findOne({ code });
};

const getAllDiscounts = async () => {
  return await Discount.find();
};

const getShopDiscounts = async (shopId) => {
  return await Discount.find({ shopId });
};

async function getShopAvailableDiscounts(shopId, userId) {
  await _updateExpiredDiscounts(shopId);

  return await Discount.find({
    shopId,
    type: "voucher", // Only "voucher" type
    status: "active", // Status must be "active"
    $or: [
      { endDate: { $exists: false } }, // No endDate or
      { endDate: { $gte: now } }, // endDate is in the future
    ],
    $expr: {
      $and: [
        // Sum of userUsages.count must not exceed maxUses (if maxUses exists)
        {
          $or: [
            { maxUses: { $exists: false } },
            {
              $lte: [{ $sum: "$userUsages.count" }, "$maxUses"],
            },
          ],
        },
        // Current user's usage count must not exceed usesPerUser (if usesPerUser exists)
        {
          $or: [
            { usesPerUser: { $exists: false } },
            {
              $lte: [
                {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        "$userUsages.count",
                        {
                          $indexOfArray: ["$userUsages.userId", userId],
                        },
                      ],
                    },
                    0,
                  ],
                },
                "$usesPerUser",
              ],
            },
          ],
        },
      ],
    },
  });
}

const _updateExpiredDiscounts = async (shopId) => {
  const now = new Date();

  await Discount.updateMany(
    {
      shopId,
      status: "active",
      endDate: { $exists: true, $lt: now },
    },
    { $set: { status: "expired" } }
  );
};

const validateDiscount = async (
  discountCode,
  userId,
  orderAmount,
  productIds
) => {
  const discount = await Discount.findOne({ code: discountCode });

  if (!discount) {
    return null;
  }

  if (!discount.isActive) {
    return null;
  }

  if (
    discount.maxUses !== null &&
    discount.userUsedIds.length >= discount.maxUses
  ) {
    return null;
  }

  if (
    discount.usesPerUser !== null &&
    discount.userUsedIds.filter((id) => id.toString() === userId.toString())
      .length >= discount.usesPerUser
  ) {
    return null;
  }

  if (
    discount.productIds.length > 0 &&
    !productIds.some((productId) =>
      discount.productIds.map((id) => id.toString()).includes(productId)
    )
  ) {
    return null;
  }

  if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
    return null;
  }

  if (discount.type === "fixed") {
    return discount.value;
  } else if (discount.type === "percentage") {
    return orderAmount * (discount.value / 100);
  }

  return null;
};

const updateDiscountUsage = async (discountCode, userId) => {
  const discount = await Discount.findOne({ code: discountCode });
  if (!discount) {
    throw new Error("Discount not found");
  }
  discount.userUsedIds.push(userId);
  return await discount.save();
};

const deleteDiscount = async (discountId) => {
  return await Discount.findByIdAndDelete(discountId);
};

const updateDiscount = async (discountId, discountData) => {
  return await Discount.findByIdAndUpdate(discountId, discountData, {
    new: true,
  });
};

module.exports = {
  createDiscount,
  getDiscountByCode,
  getAllDiscounts,
  getShopDiscounts,
  validateDiscount,
  updateDiscountUsage,
  deleteDiscount,
  updateDiscount,
  getShopAvailableDiscounts,
};
