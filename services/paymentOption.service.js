const PaymentCard = require("../models/paymentCard.model");
const User = require("../models/user.model");

// TODO: Use a robust encryption library (e.g., crypto module) for production
const _encryptData = (text) => {
  const encrypted = Buffer.from(text, "utf8").toString("base64");
  return encrypted;
};

const _decryptData = (encrypted) => {
  const decrypted = Buffer.from(encrypted, "base64").toString("utf8");
  return decrypted;
};

const changeUserCurrency = async (userId, currency) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { currency: currency },
    { new: true }
  );
  await user.save();
  return user.currency;
};

const getUserCards = async (userId) => {
  const cards = await PaymentCard.find(
    { userId: userId },
    {
      encryptedData: 0,
    }
  ).lean();
  return cards;
};

const addPaymentCard = async (userId, cardDetails) => {
  const { type, cardNumber, holderName, expiryDate } = cardDetails;

  const encryptedCardNumber = _encryptData(cardNumber);
  const lastFour = cardNumber.slice(-4);

  const newCard = await PaymentCard.create({
    userId,
    type,
    lastFour,
    holderName,
    expiryDate,
    encryptedData: encryptedCardNumber,
  });

  return {
    _id: newCard._id,
    type: newCard.type,
    lastFour: newCard.lastFour,
    holderName: newCard.holderName,
    expiryDate: newCard.expiryDate,
    isDefault: newCard.isDefault,
  };
};

const setDefaultPaymentCard = async (userId, cardId) => {
  // Reset all cards to non-default for the user
  await PaymentCard.updateMany({ userId: userId }, { isDefault: false });

  // Set the selected card as default
  const updatedCard = await PaymentCard.findByIdAndUpdate(
    cardId,
    { isDefault: true },
    { new: true, select: "-encryptedData" }
  );

  return updatedCard;
};

const removePaymentCard = async (cardId) => {
  const deletedCard = await PaymentCard.findByIdAndDelete(cardId);
  return deletedCard;
};

module.exports = {
  changeUserCurrency,
  getUserCards,
  addPaymentCard,
  setDefaultPaymentCard,
  removePaymentCard,
};
