const logger = require("../core/logger");
const cartService = require("../services/cart.service");

const addToCart = async (req, res) => {
  try {
    const result = await cartService.addToCart(req.userId, req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

const updateItemQuantity = async (req, res) => {
  try {
    const result = await cartService.updateItemQuantity(req.userId, req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const result = await cartService.removeFromCart(req.userId, req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

const getCart = async (req, res) => {
  try {
    const result = await cartService.getCart(req.userId);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

const getOrderSummary = async (req, res) => {
  try {
    const result = await cartService.getOrderSummary(req.userId, req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

module.exports = {
  getCart,
  removeFromCart,
  updateItemQuantity,
  addToCart,
  getOrderSummary,
};
