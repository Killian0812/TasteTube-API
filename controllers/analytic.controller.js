const logger = require("../logger");
const {
  getNewestShopAnalytics,
  calculateSystemMetrics,
} = require("../services/analytic.service");

const getShopAnalytics = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    if (shopId != req.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to shop analytics" });
    }
    const analytics = await getNewestShopAnalytics(shopId);
    if (!analytics) {
      return res.status(404).json({ message: "Analytics not found" });
    }
    res.status(200).json(analytics);
  } catch (error) {
    logger.error("Error fetching shop analytics:", error);
    res.status(500).json({ message: "Failed to fetch shop analytics" });
  }
};

const getSystemMetrics = async (req, res) => {
  const days = parseInt(req.query.days) || 7; // Default to 7 days if not provided
  try {
    const metrics = await calculateSystemMetrics(days);
    res.status(200).json(metrics);
  } catch (error) {
    logger.error("Error fetching system metrics:", error);
    res.status(500).json({ message: "Failed to fetch system metrics" });
  }
};

module.exports = {
  getShopAnalytics,
  getSystemMetrics,
};
