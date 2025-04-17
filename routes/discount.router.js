const express = require("express");
const router = express.Router();
const {
  createDiscount,
  getDiscountByCode,
  getAllDiscounts,
  getShopDiscounts,
  validateDiscount,
  deleteDiscount,
  updateDiscount,
} = require("../controllers/discount.controller");

router.post("/", createDiscount);
router.get("/", getAllDiscounts);
router.get("/:code", getDiscountByCode);
router.get("/shop/:shopId", getShopDiscounts);
router.post("/validate", validateDiscount);
router.delete("/:id", deleteDiscount);
router.put("/:id", updateDiscount);

module.exports = router;
