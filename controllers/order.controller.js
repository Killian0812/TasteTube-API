const orderService = require("../services/order.service");

const createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const getCustomerOrder = async (req, res) => {
  try {
    const orders = await orderService.getCustomerOrders(req.userId);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShopOrder = async (req, res) => {
  try {
    const orders = await orderService.getShopOrders(req.userId);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { newStatus, cancelReason } = req.body;
  const orderId = req.params.id;

  try {
    const order = await orderService.updateOrderStatus(
      orderId,
      newStatus,
      cancelReason,
      req.userId
    );
    res.status(200).json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getCustomerOrder,
  getShopOrder,
  updateOrderStatus,
};
