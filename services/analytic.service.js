const Analytic = require("../models/analytic.model");

const getNewestShopAnalytics = async (shopId) => {
  const analytics = await Analytic.findOne(
    { shopId },
    {},
    { sort: { date: -1 } }
  );
  return analytics;
};

module.exports = {
  getNewestShopAnalytics,
};
