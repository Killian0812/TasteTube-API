const discountService = require("../services/discount.service");

const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(req.body);
    res.status(201).json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDiscountByCode = async (req, res) => {
  try {
    const discount = await discountService.getDiscountByCode(req.params.code);
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    res.status(200).json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getAllDiscounts();
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShopDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getShopDiscounts(req.params.shopId);
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const validateDiscount = async (req, res) => {
  try {
    const { discountCode, orderAmount, productIds } = req.body;
    const userId = req.userId;
    const discount = await discountService.validateDiscount(
      discountCode,
      userId,
      orderAmount,
      productIds
    );
    if (discount === null) {
      return res.status(400).json({ message: "Invalid discount" });
    }
    res.status(200).json({ discount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDiscount = async (req, res) => {
  try {
    await discountService.deleteDiscount(req.params.id);
    res.status(200).json({ message: "Discount deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDiscount = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body);
    res.status(200).json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDiscount,
  getDiscountByCode,
  getAllDiscounts,
  getShopDiscounts,
  validateDiscount,
  deleteDiscount,
  updateDiscount,
};