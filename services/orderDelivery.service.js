const { getDistanceBetweenAddress } = require("../services/location.service");
const grabAxios = require("../utils/axios/grab.axios");

const deliveryStatus = [
  "ALLOCATING",
  "PENDING_PICKUP",
  "PICKING_UP",
  "PENDING_DROP_OFF",
  "IN_DELIVERY",
  "IN_RETURN",
  "RETURNED",
  "COMPLETED",
  "CANCELED",
  "FAILED",
];

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
  await order.save();

  return order;
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

module.exports = {
  deliveryStatus,
  getSelfDeliveryFee,
  getGrabDeliveryQuote,
  createGrabDelivery,
  createSelfDelivery,
};
