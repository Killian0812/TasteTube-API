const router = require("express").Router();
const paymentController = require("../controllers/payment.controller");
const vnpayController = require("../controllers/vnpay.controller");
const verifyJWT = require("../middlewares/verifyJWT");

router.post("/vnpay/getUrl", verifyJWT(), paymentController.getPaymentVnpayUrl);
router.post("/vnpay/ipn", vnpayController.ipn);

module.exports = router;
