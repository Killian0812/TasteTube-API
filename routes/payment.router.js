const router = require("express").Router();
const paymentController = require("../controllers/payment.controller");
const vnpayController = require("../controllers/vnpay.controller");
const verifyJWT = require("../middlewares/verifyJWT");

router.post("/cash", verifyJWT(), paymentController.createCashPayment);
router.post("/card", verifyJWT(), paymentController.createCardPayment);
router.post("/confirm", verifyJWT(), paymentController.confirmCardPayment);
router.post("/vnpay/getUrl", verifyJWT(), paymentController.getPaymentVnpayUrl);
router.get("/vnpay/ipn", vnpayController.ipn);

module.exports = router;
