const Payment = require("../models/Payment.model");
const { notifyPayment } = require("../socket.js");

const ipn = async (req, res) => {
  console.log("Recieved VNPAY IPN");
  try {
    const pid = req.query.vnp_TxnRef;
    const payment = await Payment.findById(pid);

    if (!payment) {
      return res
        .status(400)
        .json({ RspCode: "04", Message: "Payment not exist" });
    }

    const userId = payment.userId;
    notifyPayment(userId.toString(), "success", pid);

    return res.status(200).json({ RspCode: "00", Message: "Success" });
  } catch (error) {
    return res.status(500).json({ RspCode: "99", Message: error.message });
  }
};

module.exports = {
  ipn,
};
