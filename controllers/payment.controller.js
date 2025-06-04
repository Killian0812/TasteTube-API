const paymentService = require("../services/payment.service");

const getPaymentVnpayUrl = async (req, res) => {
  const userId = req.userId;

  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  const { amount, currency } = req.body;

  try {
    const result = await paymentService.getPaymentVnpayUrl(
      userId,
      ipAddr,
      amount,
      currency
    );

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createCashPayment = async (req, res) => {
  const userId = req.userId;
  const { amount, currency } = req.body;

  try {
    const result = await paymentService.createCashPayment(
      userId,
      amount,
      currency
    );

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPaymentVnpayUrl,
  createCashPayment,
};
