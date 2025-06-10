const Analytic = require("../models/analytic.model");
const { Order } = require("../models/order.model");
const { Video } = require("../models/video.model");
const User = require("../models/user.model");
const { Product } = require("../models/product.model");

const getNewestShopAnalytics = async (shopId) => {
  const analytics = await Analytic.findOne(
    { shopId },
    {},
    { sort: { date: -1 } }
  );
  return analytics;
};

const calculateSystemMetrics = async (days) => {
  // Total users
  const totalUsers = await User.countDocuments();

  // Total merchants (users with role "RESTAURANT")
  const totalMerchants = await User.countDocuments({ role: "RESTAURANT" });

  // Total videos
  const totalVideos = await Video.countDocuments();

  // Total orders
  const totalOrders = await Order.countDocuments();

  // Order count data for a line chart (orders per day for last 7 days)
  const lastDates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    lastDates.push(date.toISOString().slice(0, 10));
  }
  const ordersAgg = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(lastDates[0] + "T00:00:00.000Z"),
          $lte: new Date(lastDates[6] + "T23:59:59.999Z"),
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const ordersLineChart = lastDates.map((date) => {
    const found = ordersAgg.find((v) => v._id === date);
    return { date, count: found ? found.count : 0 };
  });

  // Bar chart 1: Top 5 most ordered products (populate product name)
  const topProductsAgg = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        count: { $sum: "$items.quantity" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  // Populate product details
  const productIds = topProductsAgg.map((p) => p._id);
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "_id name userId"
  );
  const topProducts = await Promise.all(
    topProductsAgg.map(async (item) => {
      const product = products.find(
        (p) => p._id.toString() === item._id.toString()
      );
      const shop = product
        ? await User.findById(product.userId).select("_id username")
        : null;
      return {
        count: item.count,
        productId: item._id,
        name: product ? product.name : null,
        shop,
      };
    })
  );

  // Bar chart 2: Top 5 shops by order count (populate shop name)
  const topShopsAgg = await Order.aggregate([
    {
      $group: {
        _id: "$shopId",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  // Populate shop details
  const shopIds = topShopsAgg.map((s) => s._id);
  const shops = await User.find({ _id: { $in: shopIds } });
  const topShops = topShopsAgg.map((item) => {
    const shop = shops.find((s) => s._id.toString() === item._id.toString());
    return {
      orders: item.count,
      shopId: item._id,
      name: shop ? shop.username : null,
    };
  });

  // Bar chart 3: Top 5 videos by views (already populated)
  const topVideos = await Video.find({})
    .sort({ views: -1 })
    .limit(5)
    .select({ _id: 1, title: 1, views: 1 });

  return {
    totalUsers,
    totalMerchants,
    totalVideos,
    totalOrders,
    ordersLineChart,
    topProducts,
    topShops,
    topVideos,
  };
};

module.exports = {
  getNewestShopAnalytics,
  calculateSystemMetrics,
};
