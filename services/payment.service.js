const Payment = require("../models/payment.model");
const User = require("../models/user.model");
const { ProductCode, VnpLocale, dateFormat } = require("vnpay");
const { vnpayConfig, vnpay } = require("../config/vnpay.config");
const { sendOtp, verifyOtp, messageMap } = require("../services/sms.service");

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

const createCardPayment = async (userId, amount, currency) => {
  const payment = await Payment.create({
    userId,
    amount,
    currency,
    type: "card",
  });
  // const user = await User.findById(userId);
  // await sendOtp(user.phone);
  await sendOtp('+84888264006'); // For testing purposes
  return { pid: payment.id };
};

const confirmCardPayment = async (userId, otp) => {
  // const user = await User.findById(userId);
  // await verifyOtp(user.phone, otp);
  const response = await verifyOtp('+84888264006', otp); // For testing purposes
  if (response.status !== "approved") {
    throw {
      message:
        messageMap[response.status] || "OTP is not valid. Please check again.",
    };
  }
  // Update payment status to 'paid'
  const payment = await Payment.findOneAndUpdate(
    { userId, type: "card", status: "initial" },
    { status: "paid" },
    { new: true }
  );
  return { pid: payment.id };
};

module.exports = {
  getPaymentVnpayUrl,
  createCashPayment,
  createCardPayment,
  confirmCardPayment,
};
