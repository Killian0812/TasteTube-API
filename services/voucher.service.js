const Voucher = require("../models/voucher.model");

const createVoucher = async (voucherData) => {
  const voucher = new Voucher(voucherData);
  return await voucher.save();
};

const getVoucherByCode = async (code) => {
  return await Voucher.findOne({ code });
};

const getAllVouchers = async () => {
  return await Voucher.find();
};

const getShopVouchers = async (shopId) => {
  return await Voucher.find({ shopId });
};

const validateVoucher = async (voucherCode, userId, orderAmount, productIds) => {
  const voucher = await Voucher.findOne({ code: voucherCode });

  if (!voucher) {
    return null;
  }

  if (!voucher.isActive) {
    return null;
  }

  if (voucher.maxUses !== null && voucher.userUsedIds.length >= voucher.maxUses) {
    return null;
  }

  if (
    voucher.usesPerUser !== null &&
    voucher.userUsedIds.filter((id) => id.toString() === userId.toString())
      .length >= voucher.usesPerUser
  ) {
    return null;
  }

  if (
    voucher.productIds.length > 0 &&
    !productIds.some((productId) =>
      voucher.productIds.map((id) => id.toString()).includes(productId)
    )
  ) {
    return null;
  }

  if (voucher.minOrderAmount && orderAmount < voucher.minOrderAmount) {
    return null;
  }

  if (voucher.type === "fixed") {
    return voucher.value;
  } else if (voucher.type === "percentage") {
    return orderAmount * (voucher.value / 100);
  }

  return null;
};

const updateVoucherUsage = async (voucherCode, userId) => {
  const voucher = await Voucher.findOne({ code: voucherCode });
  if (!voucher) {
    throw new Error("Voucher not found");
  }
  voucher.userUsedIds.push(userId);
  return await voucher.save();
};

const deleteVoucher = async (voucherId) => {
  return await Voucher.findByIdAndDelete(voucherId);
};

const updateVoucher = async (voucherId, voucherData) => {
  return await Voucher.findByIdAndUpdate(voucherId, voucherData, {
    new: true,
  });
};

module.exports = {
  createVoucher,
  getVoucherByCode,
  getAllVouchers,
  getShopVouchers,
  validateVoucher,
  updateVoucherUsage,
  deleteVoucher,
  updateVoucher,
};