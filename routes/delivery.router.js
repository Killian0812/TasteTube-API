const router = require("express").Router();
const deliveryController = require("../controllers/delivery.controller");

router.get("/option", deliveryController.getDeliveryOption);
router.put("/option", deliveryController.updateDeliveryOption);

module.exports = router;
