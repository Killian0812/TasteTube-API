const DeliveryOption = require("../models/deliveryOption.model");

const getDeliveryOption = async (shopId) => {
  let deliveryOption = await DeliveryOption.findOne({ shopId }).populate(
    "address"
  );

  if (!deliveryOption) {
    deliveryOption = await DeliveryOption.create({ shopId });
  }

  return {
    status: 200,
    data: deliveryOption,
  };
};

const updateDeliveryOption = async (shopId, data) => {
  const { freeDistance, feePerKm, maxDistance, address } = data;

  const updatedOption = await DeliveryOption.findOneAndUpdate(
    { shopId },
    { freeDistance, feePerKm, maxDistance, address },
    { new: true }
  ).populate("address");

  return {
    status: 200,
    data: updatedOption,
  };
};

module.exports = {
  getDeliveryOption,
  updateDeliveryOption,
};
