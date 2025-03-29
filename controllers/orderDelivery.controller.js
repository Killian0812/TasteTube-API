const Order = require("../models/order.model");
const DeliveryOption = require("../models/deliveryOption.model");
const {
  getSelfDeliveryFee,
  getGrabDeliveryQuote,
} = require("../services/orderDelivery.service");

const getOrderDeliveryQuote = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.userId;

  try {
    const order = await Order.findById(orderId)
      .populate("address")
      .populate("items.product")
      .exec();

    const deliveryOption = await DeliveryOption.findOne({
      shopId: userId,
    }).populate("address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const selfDeliveryQuote = {
      deliveryFee: await getSelfDeliveryFee(deliveryOption, order.address),
    };
    const grabDeliveryQuote = await getGrabDeliveryQuote(deliveryOption, order);

    return res.status(200).json({
      selfDeliveryQuote,
      grabDeliveryQuote,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrderDeliveryQuote,
};
