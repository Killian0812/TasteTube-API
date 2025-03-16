const router = require("express").Router();
const paymentOptionController = require("../controllers/paymentOption.controller");

router.put("/change-currency", paymentOptionController.changeCurrency);
router.get("/cards", paymentOptionController.getCards);
router.post("/add-card", paymentOptionController.addCard);
router.put("/set-default-card/:cardId", paymentOptionController.setDefaultCard);
router.delete("/remove-card/:cardId", paymentOptionController.removeCard);

module.exports = router;
