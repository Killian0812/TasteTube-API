const { Feedback, feedbackPopulate } = require("../models/feedback.model");
const Order = require("../models/order.model");

const updateProductFeedback = async (
  userId,
  { feedback, rating, orderId, productId }
) => {
  const order = await Order.findById(orderId);

  if (!order) {
    return { status: 404, data: { message: "Order not found" } };
  }

  if (order.status !== "COMPLETED") {
    return { status: 400, data: { message: "Order is not completed" } };
  }

  let feedbackDoc = await Feedback.findOneAndUpdate(
    { orderId, productId, userId },
    { feedback, rating },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  feedbackDoc = await feedbackDoc.populate(feedbackPopulate);

  return { status: 200, data: feedbackDoc };
};

const getProductFeedbacks = async (productId, query) => {
  const { page = 1, limit = 5 } = query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: feedbackPopulate,
  };

  const result = await Feedback.paginate({ productId }, options);
  return { status: 200, data: result };
};

const getUserFeedbacks = async (userId) => {
  const feedbacks = await Feedback.find({ userId }).populate(feedbackPopulate);
  return { status: 200, data: feedbacks };
};

const getOrderFeedbacks = async (orderId) => {
  const feedbacks = await Feedback.find({ orderId }).populate(feedbackPopulate);
  return { status: 200, data: feedbacks };
};

module.exports = {
  updateProductFeedback,
  getProductFeedbacks,
  getUserFeedbacks,
  getOrderFeedbacks,
};
