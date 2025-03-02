const Payment = require("../models/Payment.model");
const { sortObject } = require("../utils/object");
const { vnpayConfig } = require("../config/vnpay.config");
const querystring = require("qs");
const crypto = require("crypto");
const moment = require("moment");

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

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const ipnUrl =
      vnpayConfig.ipnUrl +
      "?" +
      querystring.stringify({ pid: payment.id }, { encode: false });

    const params = {};
    params["vnp_Version"] = "2.1.0";
    params["vnp_Command"] = "pay";
    params["vnp_TmnCode"] = vnpayConfig.terminalId;
    params["vnp_Locale"] = "en";
    params["vnp_CurrCode"] = currency;
    params["vnp_TxnRef"] = payment.id;
    params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + payment.id;
    params["vnp_OrderType"] = "other";
    params["vnp_Amount"] = amount * 100;
    params["vnp_IpAddr"] = ipAddr;
    params["vnp_CreateDate"] = createDate;
    params["vnp_ReturnUrl"] = vnpayConfig.returnUrl;

    const signData = querystring.stringify(sortObject(params), {
      encode: false,
    });
    const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    params["vnp_SecureHash"] = signed;

    const url =
      vnpayConfig.url + "?" + querystring.stringify(params, { encode: false });

    return res.status(201).json({ url: url, pid: payment.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPaymentVnpayUrl,
};
