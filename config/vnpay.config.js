const { VNPay } = require("vnpay");

const vnpayConfig = {
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  terminalId: "3XRWFRYP",
  hashSecret: "KPDD3B0BPE9BZG25XYP514O5N5I1WS09",
  returnUrl: "https://first-shepherd-legible.ngrok-free.app/payment/success",
  ipnUrl: "https://first-shepherd-legible.ngrok-free.app/api/payment/vnpay/ipn",
};

const vnpay = new VNPay({
  api_Host: "https://sandbox.vnpayment.vn",
  tmnCode: "3XRWFRYP",
  secureSecret: "KPDD3B0BPE9BZG25XYP514O5N5I1WS09",
  testMode: true,
});

module.exports = { vnpayConfig, vnpay };
