const router = require("express").Router();
const orderDeliveryController = require("../controllers/orderDelivery.controller");

router.get("/:orderId", orderDeliveryController.getOrderDeliveryStatus);
router.post("/:orderId", orderDeliveryController.createOrderDelivery);
router.put("/:orderId", orderDeliveryController.updateSelfOrderDelivery);
router.delete("/:orderId", orderDeliveryController.cancelOrderDelivery);
router.post("/:orderId/renew", orderDeliveryController.renewOrderDelivery);
router.get("/:orderId/quote", orderDeliveryController.getOrderDeliveryQuote);

module.exports = router;
