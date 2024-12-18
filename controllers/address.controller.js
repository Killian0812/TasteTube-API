const Address = require("../models/address.model");

const getAddresses = async (req, res) => {
  const userId = req.userId;
  try {
    const addresses = await Address.find({ userId: userId });
    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAddress = async (req, res) => {
  const userId = req.userId;
  const { name, phone, value } = req.body;
  try {
    const newAddress = new Address({ userId, name, phone, value });
    await newAddress.save();
    res.status(201).json(newAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const { name, phone, value } = req.body;
  try {
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { name: name, phone: phone, value: value },
      { new: true }
    );
    if (!updatedAddress)
      return res.status(404).json({ message: "Category not found" });
    return res.status(200).json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  try {
    await Address.findByIdAndDelete(addressId);
    return res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAddresses, deleteAddress, createAddress, updateAddress };
