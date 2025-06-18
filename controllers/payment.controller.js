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

const createCardPayment = async (req, res) => {
  const userId = req.userId;
  const { amount, currency } = req.body;

  try {
    const result = await paymentService.createCardPayment(
      userId,
      amount,
      currency
    );

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const confirmCardPayment = async (req, res) => {
  const userId = req.userId;
  const { otp } = req.body;

  try {
    const result = await paymentService.confirmCardPayment(userId, otp);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}


module.exports = {
  getPaymentVnpayUrl,
  createCashPayment,
  createCardPayment,
  confirmCardPayment,
};
