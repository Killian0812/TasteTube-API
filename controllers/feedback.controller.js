const { Feedback, feedbackPopulate } = require("../models/feedback.model");
const Order = require("../models/order.model");

// Create or update a rating for a product in an order
const updateProductFeedback = async (req, res) => {
  const userId = req.userId;
  const { feedback, rating, orderId, productId } = req.body;

  try {
    // Check if the order belongs to the user and contains the product
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "COMPLETED") {
      return res.status(400).json({ message: "Order is not completed" });
    }

    // Upsert rating (update if exists, otherwise create)
    let feedbackDoc = await Feedback.findOneAndUpdate(
      { orderId, productId, userId },
      { feedback, rating },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    feedbackDoc = await feedbackDoc.populate(feedbackPopulate);

    return res.status(200).json(feedbackDoc);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all ratings for a product with pagination
const getProductFeedbacks = async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 5 } = req.query;

  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const result = await Feedback.paginate(
      { productId },
      {
        ...options,
        populate: feedbackPopulate,
      }
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all ratings by a user
const getUserFeedbacks = async (req, res) => {
  const userId = req.userId;
  try {
    const feedbacks = await Feedback.find({ userId }).populate(
      feedbackPopulate
    );
    return res.status(200).json(feedbacks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all feedbacks for a specific order
const getOrderFeedbacks = async (req, res) => {
  const { orderId } = req.params;
  try {
    const feedbacks = await Feedback.find({ orderId }).populate(
      feedbackPopulate
    );
    return res.status(200).json(feedbacks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateProductFeedback,
  getProductFeedbacks,
  getUserFeedbacks,
  getOrderFeedbacks,
};
