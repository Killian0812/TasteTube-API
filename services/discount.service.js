const Discount = require("../models/discount.model");

const createDiscount = async (discountData) => {
  const discount = new Discount(discountData);
  return await discount.save();
};

const getShopDiscountByCode = async (code, shopId) => {
  return await Discount.findOne({ code, shopId });
};

const getAllDiscounts = async () => {
  return await Discount.find();
};

const getShopDiscounts = async (shopId) => {
  await _updateExpiredDiscounts(shopId);
  return await Discount.find({ shopId, status: { $ne: "deleted" } });
};

async function getShopAvailableDiscounts(shopId, userId) {
  await _updateExpiredDiscounts(shopId);

  const nonExpiredDiscounts = await Discount.find({
    shopId,
    type: "voucher",
    status: "active",
    $or: [
      { endDate: { $eq: null } }, // No endDate or
      { endDate: { $gte: new Date() } }, // endDate is in the future
    ],
  });

  const availableDiscounts = nonExpiredDiscounts.filter((discount) => {
    // Check if the discount has not exceeded maxUses
    const hasRemainingUses =
      discount.maxUses === null ||
      (discount.userUsages &&
        discount.userUsages.reduce((sum, usage) => sum + usage.count, 0) <
          discount.maxUses);

    if (!hasRemainingUses) return false;

    // Check if the discount has not exceeded usesPerUser for the given user
    const userUsage = discount.userUsages
      ? discount.userUsages.find((usage) => usage.userId.toString() === userId)
      : null;
    const hasRemainingUserUses =
      discount.usesPerUser === null ||
      !userUsage ||
      userUsage.count < discount.usesPerUser;

    return hasRemainingUserUses;
  });

  return availableDiscounts;
}

const _updateExpiredDiscounts = async (shopId) => {
  const now = new Date();

  await Discount.updateMany(
    {
      shopId,
      status: "active",
      endDate: { $ne: null, $lt: now },
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

const deleteDiscount = async (discountId) => {
  return await Discount.findByIdAndUpdate(discountId, {
    status: "deleted",
  });
};

const updateDiscount = async (discountId, discountData) => {
  return await Discount.findByIdAndUpdate(discountId, discountData, {
    new: true,
  });
};

module.exports = {
  createDiscount,
  getShopDiscountByCode,
  getAllDiscounts,
  getShopDiscounts,
  validateDiscount,
  deleteDiscount,
  updateDiscount,
  getShopAvailableDiscounts,
};
