const router = require("express").Router();
const shopController = require("../controllers/shop.controller");

router.get("/recommended", shopController.getRecommendedProducts);
router.get("/search", shopController.searchProducts);
router.get("/:shopId", shopController.getProductsInShop);
router.get("/:shopId/search", shopController.searchProducts);

module.exports = router;
