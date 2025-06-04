const deliveryService = require("../services/delivery.service.js");
const logger = require("../core/logger");

const getDeliveryOption = async (req, res) => {
  try {
    const result = await deliveryService.getDeliveryOption(req.userId);
    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({ message: error.message ?? "Internal server error" });
  }
};

const updateDeliveryOption = async (req, res) => {
  try {
    const result = await deliveryService.updateDeliveryOption(
      req.userId,
      req.body
    );
    res.status(result.status).json(result.data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: error.message ?? "Internal server error" });
  }
};

module.exports = {
  getDeliveryOption,
  updateDeliveryOption,
};
