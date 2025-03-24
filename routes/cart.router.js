const router = require("express").Router();
const cartController = require("../controllers/cart.controller");

router.get("/", cartController.getCart);
router.delete("/", cartController.removeFromCart);
router.post("/update", cartController.updateItemQuantity); // Update existing items qty in cart page
router.post("/add", cartController.addToCart); // Add to cart from order page
router.post("/order-summary", cartController.getOrderSummary); // Get order summary (delivery fee, discount, total amount, etc.)

module.exports = router;
