const querystring = require("qs");
const crypto = require("crypto");
const { sortObject } = require("../utils/object");
const moment = require("moment");
const { vnpayConfig } = require("./vnpay.config");

const createPaymentUrl = (ipAddr, amount, currency, pid) => {
  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  const params = {};
  params["vnp_Version"] = "2.1.0";
  params["vnp_Command"] = "pay";
  params["vnp_TmnCode"] = vnpayConfig.terminalId;
  params["vnp_Locale"] = "en";
  params["vnp_CurrCode"] = currency;
  params["vnp_TxnRef"] = pid;
  params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + pid;
  params["vnp_OrderType"] = "other";
  params["vnp_Amount"] = amount;
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

  return url;
};

module.exports = { createPaymentUrl };
