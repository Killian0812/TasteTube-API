const PaymentCard = require("../models/paymentCard.model");
const User = require("../models/user.model");

// TODO: Use secret encryption
const _encryptData = (text) => {
  const encrypted = Buffer.from(text, "utf8").toString("base64");
  return encrypted;
};

const _decryptData = (encrypted) => {
  const decrypted = Buffer.from(encrypted, "base64").toString("utf8");
  return decrypted;
};

const changeCurrency = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        currency: req.body.currency,
      },
      { new: true }
    );
    await user.save();
    return res.status(200).json({
      updatedCurrency: user.currency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCards = async (req, res) => {
  try {
    const cards = await PaymentCard.find({
      userId: req.userId,
    });
    return res.status(200).json(
      cards.map((card) => ({
        id: card.id,
        type: card.type,
        lastFour: card.lastFour,
        holderName: card.holderName,
        expiryDate: card.expiryDate,
        isDefault: card.isDefault,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCard = async (req, res) => {
  const { type, cardNumber, holderName, expiryDate } = req.body;

  try {
    const encryptedCardNumber = _encryptData(cardNumber);
    const lastFour = cardNumber.slice(-4);

    const newCard = new PaymentCard({
      userId: req.userId,
      type,
      lastFour,
      holderName,
      expiryDate,
      encryptedData: encryptedCardNumber,
    });
    await newCard.save();

    return res.status(201).json({
      id: newCard.id,
      type: newCard.type,
      lastFour: newCard.lastFour,
      holderName: newCard.holderName,
      expiryDate: newCard.expiryDate,
      isDefault: newCard.isDefault,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const setDefaultCard = async (req, res) => {
  try {
    // Reset all cards to non-default
    await PaymentCard.updateMany({ userId: req.userId }, { isDefault: false });

    // Set the selected card as default
    const updatedCard = await PaymentCard.findByIdAndUpdate(
      req.params.cardId,
      { isDefault: true },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    return res.status(200).json({
      id: updatedCard.id,
      type: updatedCard.type,
      lastFour: updatedCard.lastFour,
      holderName: updatedCard.holderName,
      expiryDate: updatedCard.expiryDate,
      isDefault: updatedCard.isDefault,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCard = async (req, res) => {
  try {
    const deletedCard = await PaymentCard.findByIdAndDelete(req.params.cardId);
    if (!deletedCard) {
      return res.status(404).json({ message: "Card not found" });
    }
    return res.status(200).json({
      id: deletedCard.id,
      type: deletedCard.type,
      lastFour: deletedCard.lastFour,
      holderName: deletedCard.holderName,
      expiryDate: deletedCard.expiryDate,
      isDefault: deletedCard.isDefault,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  changeCurrency,
  getCards,
  addCard,
  setDefaultCard,
  removeCard,
};
