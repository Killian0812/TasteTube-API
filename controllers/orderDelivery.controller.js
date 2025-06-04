const { Order } = require("../models/order.model");
const DeliveryOption = require("../models/deliveryOption.model");
const {
  getSelfDeliveryFee,
  getGrabDeliveryQuote,
  createGrabDelivery,
  createSelfDelivery,
  getGrabDeliveryDetail,
  updateSelfDelivery,
  cancelGrabDelivery,
} = require("../services/orderDelivery.service");

const getOrderDeliveryStatus = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId).populate("address");
    const deliveryOption = await DeliveryOption.findOne({
      shopId: order.shopId,
    }).populate("address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const deliveryType = order.deliveryType || "NONE";
    let deliveryStatusLog = order.deliveryStatusLog || [];

    if (order.deliveryType === "GRAB") {
      const detail = await getGrabDeliveryDetail(order);
      if (detail.status === "COMPLETED") {
        order.status = "COMPLETED";
      }
      if (
        detail.status !=
        order.deliveryStatusLog[order.deliveryStatusLog.length - 1]
          .deliveryStatus
      ) {
        if (detail.status === "ALLOCATING") {
          order.deliveryStatusLog = [
            {
              deliveryStatus: detail.status,
              deliveryTimestamp: Date.now(),
            },
          ];
        } else {
          order.deliveryStatusLog.push({
            deliveryStatus: detail.status,
            deliveryTimestamp: Date.now(),
          });
        }
      }
      await order.save();
    }

    return res.status(200).json({
      deliveryType,
      deliveryStatusLog,
      origin: deliveryOption.address.value,
      destination: order.address.value,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createOrderDelivery = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.userId;
  const deliveryType = req.query.deliveryType;

  try {
    const order = await Order.findById(orderId)
      .populate("address")
      .populate("items.product")
      .exec();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let delivery;
    switch (deliveryType) {
      case "SELF":
        delivery = createSelfDelivery(order);
        break;
      case "GRAB":
        const deliveryOption = await DeliveryOption.findOne({
          shopId: userId,
        }).populate("address");
        delivery = createGrabDelivery(deliveryOption, order);
        break;
      default:
        return res.status(500).json({ message: "Invalid delvery type" });
    }

    return res.status(200).json(delivery);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrderDeliveryQuote = async (req, res) => {
  const orderId = req.params.orderId;
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
      amount: await getSelfDeliveryFee(deliveryOption, order.address),
    };
    const grabDeliveryQuote = await getGrabDeliveryQuote(deliveryOption, order);

    return res.status(200).json({
      origin: deliveryOption.address.value,
      destination: order.address.value,
      selfDeliveryQuote,
      grabDeliveryQuote,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSelfOrderDelivery = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.query.newStatus;

  try {
    const order = await Order.findById(orderId);
    const updated = await updateSelfDelivery(order, newStatus);

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelOrderDelivery = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryType === "SELF") {
      order.deliveryStatusLog = [];
      order.deliveryType = "NONE";
      order.status = "DELIVERY";
      await order.save();
    } else if (order.deliveryType === "GRAB") {
      await cancelGrabDelivery(order);
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const renewOrderDelivery = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.deliveryStatusLog = [];
    order.deliveryType = "NONE";
    order.deliveryId = "";
    order.status = "DELIVERY";
    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrderDeliveryStatus,
  createOrderDelivery,
  getOrderDeliveryQuote,
  updateSelfOrderDelivery,
  cancelOrderDelivery,
  renewOrderDelivery,
};
