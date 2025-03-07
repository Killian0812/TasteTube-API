const { VNPay } = require("vnpay");

const vnpayConfig = {
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  terminalId: process.env.VNPAY_TERMINALID,
  hashSecret: process.env.VNPAY_SECRET,
  returnUrl: "https://first-shepherd-legible.ngrok-free.app/payment/success",
  ipnUrl: "https://first-shepherd-legible.ngrok-free.app/api/payment/vnpay/ipn",
};

const vnpay = new VNPay({
  api_Host: "https://sandbox.vnpayment.vn",
  tmnCode: process.env.VNPAY_TERMINALID,
  secureSecret: process.env.VNPAY_SECRET,
  testMode: true,
});

module.exports = { vnpayConfig, vnpay };
