const orderDeliveryService = require("../services/orderDelivery.service");

const getOrderDeliveryStatus = async (req, res) => {
  try {
    const result = await orderDeliveryService.getOrderDeliveryStatus(
      req.params.orderId
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createOrderDelivery = async (req, res) => {
  try {
    const result = await orderDeliveryService.createOrderDelivery(
      req.params.orderId,
      req.userId,
      req.query.deliveryType
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrderDeliveryQuote = async (req, res) => {
  try {
    const result = await orderDeliveryService.getOrderDeliveryQuote(
      req.params.orderId,
      req.userId
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSelfOrderDelivery = async (req, res) => {
  try {
    const result = await orderDeliveryService.updateSelfOrderDelivery(
      req.params.orderId,
      req.query.newStatus
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelOrderDelivery = async (req, res) => {
  try {
    const result = await orderDeliveryService.cancelOrderDelivery(
      req.params.orderId
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const renewOrderDelivery = async (req, res) => {
  try {
    const result = await orderDeliveryService.renewOrderDelivery(
      req.params.orderId
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrderDeliveryStatus,
  createOrderDelivery,
  getOrderDeliveryQuote,
  updateSelfOrderDelivery,
  cancelOrderDelivery,
  renewOrderDelivery,
};
