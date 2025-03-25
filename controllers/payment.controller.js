const Payment = require("../models/payment.model");
const { ProductCode, VnpLocale } = require("vnpay");
const { vnpayConfig, vnpay } = require("../config/vnpay.config");

const getPaymentVnpayUrl = async (req, res) => {
  const userId = req.userId;
  const { amount, currency } = req.body;

  try {
    const payment = new Payment({
      userId,
      amount,
      currency,
    });

    await payment.save();

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const url = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: payment.id,
      vnp_OrderInfo: "Thanh toan cho ma GD:" + payment.id,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: vnpayConfig.returnUrl,
      vnp_Locale: VnpLocale.EN,
    });

    return res.status(201).json({ url: url, pid: payment.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createCashPayment = async (req, res) => {
  const userId = req.userId;
  const { amount, currency } = req.body;

  try {
    const payment = await Payment.create({
      userId,
      amount,
      currency,
    });
    return res.status(201).json({ pid: payment.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPaymentVnpayUrl,
  createCashPayment,
};
