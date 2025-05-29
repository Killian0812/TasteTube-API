const Address = require("../models/address.model");

const getAddresses = async (req, res) => {
  const userId = req.userId;
  try {
    const addresses = await Address.find({ userId: userId, active: { $ne: false } });
    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const upsertAddress = async (req, res) => {
  const { addressId } = req.query;
  const userId = req.userId;
  const { name, phone, value, latitude, longitude } = req.body;

  try {
    let result;

    if (addressId) {
      result = await Address.findByIdAndUpdate(
        addressId,
        { name, phone, value, latitude, longitude },
        { new: true, runValidators: true }
      );
      if (!result) {
        return res.status(404).json({ message: "Address not found" });
      }
      return res.status(200).json(result);
    } else {
      const newAddress = new Address({
        userId,
        name,
        phone,
        value,
        latitude,
        longitude,
      });
      result = await newAddress.save();
      return res.status(201).json(result);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  try {
    await Address.findByIdAndUpdate(addressId, { active: false });
    return res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAddresses, upsertAddress, deleteAddress };
