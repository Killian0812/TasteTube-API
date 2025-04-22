const { getNewestShopAnalytics } = require("../services/analytic.service");

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
    console.error("Error fetching shop analytics:", error);
    res.status(500).json({ message: "Failed to fetch shop analytics" });
  }
};

module.exports = {
  getShopAnalytics,
};
