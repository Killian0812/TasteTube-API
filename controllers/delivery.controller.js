const DeliveryOption = require("../models/deliveryOption.model");

const getDeliveryOption = async (req, res) => {
  const userId = req.userId;
  try {
    let deliveryOption = await DeliveryOption.findOne({
      shopId: userId,
    }).populate("address");
    if (!deliveryOption) {
      deliveryOption = await DeliveryOption.create({
        shopId: userId,
      });
    }
    res.status(200).json(deliveryOption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDeliveryOption = async (req, res) => {
  const userId = req.userId;
  const { freeDistance, feePerKm, maxDistance, address } = req.body;
  try {
    const updatedOption = await DeliveryOption.findOneAndUpdate(
      { shopId: userId },
      { freeDistance, feePerKm, maxDistance, address },
      { new: true }
    ).populate("address");
    res.status(200).json(updatedOption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDeliveryOption, updateDeliveryOption };
