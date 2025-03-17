const { VNPay } = require("vnpay");
const { baseUrl } = require("../utils/constant");

const vnpayConfig = {
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  terminalId: process.env.VNPAY_TERMINAL_ID,
  hashSecret: process.env.VNPAY_SECRET,
  returnUrl: `${baseUrl}/payment/success`,
  ipnUrl: `${baseUrl}/api/payment/vnpay/ipn`,
};

const vnpay = new VNPay({
  api_Host: "https://sandbox.vnpayment.vn",
  tmnCode: process.env.VNPAY_TERMINAL_ID,
  secureSecret: process.env.VNPAY_SECRET,
  testMode: true,
});

module.exports = { vnpayConfig, vnpay };
