const express = require("express");
const router = express.Router();
const {
  createDiscount,
  getShopDiscountByCode,
  getAllDiscounts,
  getShopDiscounts,
  validateDiscount,
  deleteDiscount,
  updateDiscount,
} = require("../controllers/discount.controller");

router.post("/", createDiscount);
router.get("/", getAllDiscounts);
router.get("/code/:code", getShopDiscountByCode);
router.get("/shop/:shopId", getShopDiscounts);
router.post("/validate", validateDiscount);
router.delete("/:id", deleteDiscount);
router.put("/:id", updateDiscount);

module.exports = router;
