const { getDistanceBetweenAddress } = require("../services/location.service");
const { Order } = require("../models/order.model");
const DeliveryOption = require("../models/deliveryOption.model");
const grabAxios = require("../utils/axios/grab.axios");

const getGrabDeliveryQuote = async (deliveryOption, order) => {
  const packages = order.items.map((item) => {
    const product = item.product;
    return {
      name: product.name.slice(0, 500),
      description: product.description
        ? product.description.slice(0, 500)
        : "No description",
      quantity: item.quantity,
      dimensions: {
        height: product.dimensions?.height || 10,
        width: product.dimensions?.width || 10,
        depth: product.dimensions?.depth || 10,
        weight: product.dimensions?.weight || 100,
      },
    };
  });

  const shopAddress = deliveryOption.address;
  const origin = {
    address: shopAddress.value,
    coordinates: {
      latitude: shopAddress.latitude,
      longitude: shopAddress.longitude,
    },
  };

  const customerAddress = order.address;
  const destination = {
    address: customerAddress.value,
    coordinates: {
      latitude: customerAddress.latitude,
      longitude: customerAddress.longitude,
    },
  };

  // COD amount to be collected by driver.
  let cashOnDelivery;
  if (order.paymentMethod === "COD" && !order.paid) {
    cashOnDelivery = {
      amount: order.total,
    };
  }

  const requestBody = {
    serviceType: "INSTANT",
    packages,
    origin,
    destination,
    ...(cashOnDelivery && { cashOnDelivery }), // Only if COD
    paymentMethod: cashOnDelivery ? "CASH" : "CASHLESS",
  };

  const response = await grabAxios.post("/deliveries/quotes", requestBody);
  const { amount, estimatedTimeline } = response.data.quotes[0];
  return { amount, estimatedTimeline };
};

const createGrabDelivery = async (deliveryOption, order) => {
  const customerAddress = order.address;
  const shopAddress = deliveryOption.address;

  const packages = order.items.map((item) => {
    const product = item.product;
    return {
      name: product.name.slice(0, 500),
      description: product.description
        ? product.description.slice(0, 500)
        : "No description",
      quantity: item.quantity,
      dimensions: {
        height: product.dimensions?.height || 10,
        width: product.dimensions?.width || 10,
        depth: product.dimensions?.depth || 10,
        weight: product.dimensions?.weight || 100,
      },
    };
  });

  const origin = {
    address: shopAddress.value,
    coordinates: {
      latitude: shopAddress.latitude,
      longitude: shopAddress.longitude,
    },
  };

  const destination = {
    address: customerAddress.value,
    coordinates: {
      latitude: customerAddress.latitude,
      longitude: customerAddress.longitude,
    },
  };

  const sender = {
    firstName: shopAddress.name,
    phone: customerAddress.phone,
    smsEnabled: true,
  };

  const recipient = {
    firstName: customerAddress.name,
    phone: customerAddress.phone,
    smsEnabled: true,
  };

  let cashOnDelivery;
  if (order.paymentMethod === "COD" && !order.paid) {
    cashOnDelivery = {
      amount: order.total,
    };
  }

  const requestBody = {
    merchantOrderID: order.trackingId,
    serviceType: "INSTANT",
    packages,
    origin,
    destination,
    sender,
    recipient,
    paymentMethod: cashOnDelivery ? "CASH" : "CASHLESS",
    ...(cashOnDelivery && { cashOnDelivery }),
  };

  const response = await grabAxios.post("/deliveries", requestBody);

  // Update order with delivery details
  order.status = "DELIVERY";
  order.deliveryType = "GRAB";
  order.deliveryStatusLog = [
    {
      deliveryStatus: response.data.status,
      deliveryTimestamp: Date.now(),
    },
  ];
  order.deliveryId = response.data.deliveryID;
  await order.save();

  return order;
};

const getGrabDeliveryDetail = async (order) => {
  const response = await grabAxios.get(`/deliveries/${order.deliveryId}`);
  return response.data;
};

const cancelGrabDelivery = async (order) => {
  const response = await grabAxios.delete(`/deliveries/${order.deliveryId}`);
  order.deliveryId = "";
  order.deliveryStatusLog = [];
  order.deliveryType = "NONE";
  await order.save();
  return response.data;
};

const getSelfDeliveryFee = async (deliveryOption, address) => {
  const { freeDistance, feePerKm, maxDistance } = deliveryOption;
  const distance = await getDistanceBetweenAddress(
    deliveryOption.address,
    address
  );
  if (distance == -1 || distance > maxDistance * 1000) {
    return NaN;
  }
  if (distance <= freeDistance * 1000) {
    return 0;
  }
  return (
    Math.round(((distance - freeDistance * 1000) / 1000) * feePerKm * 10) / 10
  );
};

const createSelfDelivery = async (order) => {
  order.status = "DELIVERY";
  order.deliveryType = "SELF";
  order.deliveryStatusLog = [
    {
      deliveryStatus: "ALLOCATING",
      deliveryTimestamp: Date.now(),
    },
  ];
  await order.save();

  return order;
};

const updateSelfDelivery = async (order, newStatus) => {
  const existingStatusIndex = order.deliveryStatusLog.findIndex(
    (log) => log.deliveryStatus === newStatus
  );

  // Remove all logs after newStatus if exists
  if (existingStatusIndex !== -1) {
    order.deliveryStatusLog = order.deliveryStatusLog.slice(
      0,
      existingStatusIndex + 1
    );
    order.deliveryStatusLog[existingStatusIndex].deliveryTimestamp = Date.now();
    order.status = "DELIVERY";
  } else {
    order.deliveryStatusLog.push({
      deliveryStatus: newStatus,
      deliveryTimestamp: Date.now(),
    });
  }

  if (newStatus === "COMPLETED") order.status = "COMPLETED";
  await order.save();

  return order;
};

const getOrderDeliveryStatus = async (orderId) => {
  const order = await Order.findById(orderId).populate("address");
  if (!order) throw new Error("Order not found");

  const deliveryOption = await DeliveryOption.findOne({
    shopId: order.shopId,
  }).populate("address");

  const deliveryType = order.deliveryType || "NONE";
  const deliveryStatusLog = order.deliveryStatusLog || [];

  if (order.deliveryType === "GRAB") {
    const detail = await getGrabDeliveryDetail(order);
    const lastStatus =
      order.deliveryStatusLog[order.deliveryStatusLog.length - 1]
        ?.deliveryStatus;

    if (detail.status === "COMPLETED") {
      order.status = "COMPLETED";
    }

    if (detail.status !== lastStatus) {
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

  return {
    deliveryType,
    deliveryStatusLog,
    origin: deliveryOption.address.value,
    destination: order.address.value,
  };
};

const createOrderDelivery = async (orderId, userId, deliveryType) => {
  const order = await Order.findById(orderId)
    .populate("address")
    .populate("items.product");

  if (!order) {
    throw new Error("Order not found");
  }

  if (deliveryType === "SELF") {
    return createSelfDelivery(order);
  } else if (deliveryType === "GRAB") {
    const deliveryOption = await DeliveryOption.findOne({
      shopId: userId,
    }).populate("address");
    return createGrabDelivery(deliveryOption, order);
  } else {
    throw new Error("Invalid delivery type");
  }
};

const getOrderDeliveryQuote = async (orderId, userId) => {
  const order = await Order.findById(orderId)
    .populate("address")
    .populate("items.product");

  if (!order) {
    throw new Error("Order not found");
  }

  const deliveryOption = await DeliveryOption.findOne({
    shopId: userId,
  }).populate("address");

  const selfDeliveryQuote = {
    amount: await getSelfDeliveryFee(deliveryOption, order.address),
  };
  const grabDeliveryQuote = await getGrabDeliveryQuote(deliveryOption, order);

  return {
    origin: deliveryOption.address.value,
    destination: order.address.value,
    selfDeliveryQuote,
    grabDeliveryQuote,
  };
};

const updateSelfOrderDelivery = async (orderId, newStatus) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  return updateSelfDelivery(order, newStatus);
};

const cancelOrderDelivery = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.deliveryType === "SELF") {
    order.deliveryStatusLog = [];
    order.deliveryType = "NONE";
    order.status = "DELIVERY";
    await order.save();
    return order;
  } else if (order.deliveryType === "GRAB") {
    await cancelGrabDelivery(order);
    return order;
  }
};

const renewOrderDelivery = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  order.deliveryStatusLog = [];
  order.deliveryType = "NONE";
  order.deliveryId = "";
  order.status = "DELIVERY";
  await order.save();

  return order;
};

module.exports = {
  // Grab delivery
  getGrabDeliveryQuote,
  createGrabDelivery,
  getGrabDeliveryDetail,
  cancelGrabDelivery,

  // Self delivery
  getSelfDeliveryFee,
  createSelfDelivery,
  updateSelfDelivery,

  getOrderDeliveryStatus,
  createOrderDelivery,
  getOrderDeliveryQuote,
  updateSelfOrderDelivery,
  cancelOrderDelivery,
  renewOrderDelivery,
};
