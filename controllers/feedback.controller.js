const feedbackService = require("../services/feedback.service.js");
const logger = require("../core/logger");

const updateProductFeedback = async (req, res) => {
  try {
    const result = await feedbackService.updateProductFeedback(
      req.userId,
      req.body
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getProductFeedbacks = async (req, res) => {
  try {
    const result = await feedbackService.getProductFeedbacks(
      req.params.productId,
      req.query
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserFeedbacks = async (req, res) => {
  try {
    const result = await feedbackService.getUserFeedbacks(req.userId);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getOrderFeedbacks = async (req, res) => {
  try {
    const result = await feedbackService.getOrderFeedbacks(req.params.orderId);
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  updateProductFeedback,
  getProductFeedbacks,
  getUserFeedbacks,
  getOrderFeedbacks,
};
