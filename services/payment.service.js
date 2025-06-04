const Payment = require("../models/payment.model");
const { ProductCode, VnpLocale, dateFormat } = require("vnpay");
const { vnpayConfig, vnpay } = require("../config/vnpay.config");

const getPaymentVnpayUrl = async (userId, ipAddr, amount, currency) => {
  const payment = new Payment({
    userId,
    amount,
    currency,
  });

  await payment.save();

  const createDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const url = vnpay.buildPaymentUrl({
    vnp_Amount: amount,
    vnp_IpAddr: ipAddr,
    vnp_TxnRef: payment.id,
    vnp_OrderInfo: "Thanh toan cho ma GD:" + payment.id,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: vnpayConfig.returnUrl,
    vnp_Locale: VnpLocale.EN,
    vnp_CreateDate: dateFormat(createDate, "yyyyMMddHHmmss"),
  });

  return { url: url, pid: payment.id };
};

const createCashPayment = async (userId, amount, currency) => {
  const payment = await Payment.create({
    userId,
    amount,
    currency,
  });
  return { pid: payment.id };
};

module.exports = {
  getPaymentVnpayUrl,
  createCashPayment,
};
