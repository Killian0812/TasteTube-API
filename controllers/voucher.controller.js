const voucherService = require("../services/voucher.service");

const createVoucher = async (req, res) => {
  try {
    const voucher = await voucherService.createVoucher(req.body);
    res.status(201).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVoucherByCode = async (req, res) => {
  try {
    const voucher = await voucherService.getVoucherByCode(req.params.code);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.status(200).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await voucherService.getAllVouchers();
    res.status(200).json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShopVouchers = async (req, res) => {
  try {
    const vouchers = await voucherService.getShopVouchers(req.params.shopId);
    res.status(200).json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const validateVoucher = async (req, res) => {
  try {
    const { voucherCode, orderAmount, productIds } = req.body;
    const userId = req.userId;
    const discount = await voucherService.validateVoucher(
      voucherCode,
      userId,
      orderAmount,
      productIds
    );
    if (discount === null) {
      return res.status(400).json({ message: "Invalid voucher" });
    }
    res.status(200).json({ discount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    await voucherService.deleteVoucher(req.params.id);
    res.status(200).json({ message: "Voucher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVoucher = async (req, res) => {
  try {
    const voucher = await voucherService.updateVoucher(req.params.id, req.body);
    res.status(200).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVoucher,
  getVoucherByCode,
  getAllVouchers,
  getShopVouchers,
  validateVoucher,
  deleteVoucher,
  updateVoucher,
};