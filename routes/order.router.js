const router = require("express").Router();
const orderController = require("../controllers/order.controller");

router.post("/", orderController.createOrder);
router.get("/customer", orderController.getCustomerOrder);
router.get("/shop", orderController.getShopOrder);
router.put("/:id/status", orderController.updateOrderStatus);

module.exports = router;
