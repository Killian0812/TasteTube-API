const router = require("express").Router();
const orderDeliveryController = require("../controllers/orderDelivery.controller");

router.get("/:id", orderDeliveryController.getOrderDeliveryQuote);

module.exports = router;
