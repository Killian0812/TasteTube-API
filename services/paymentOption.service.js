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
  );
  return cards.map((card) => ({
    id: card.id,
    type: card.type,
    lastFour: card.lastFour,
    holderName: card.holderName,
    expiryDate: card.expiryDate,
    isDefault: card.isDefault,
  }));
};



const addPaymentCard = async (userId, cardDetails) => {
  const { type, cardNumber, holderName, expiryDate } = cardDetails;

  const encryptedCardNumber = _encryptData(cardNumber);
  const lastFour = cardNumber.slice(-4);

  const newCard = new PaymentCard({
    userId,
    type,
    lastFour,
    holderName,
    expiryDate,
    encryptedData: encryptedCardNumber,
  });
  await newCard.save();

  return {
    id: newCard.id,
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
    { new: true }
  );

  if (!updatedCard) {
    return null; // Or throw an error if preferred
  }

  return {
    id: updatedCard.id,
    type: updatedCard.type,
    lastFour: updatedCard.lastFour,
    holderName: updatedCard.holderName,
    expiryDate: updatedCard.expiryDate,
    isDefault: updatedCard.isDefault,
  };
};

const removePaymentCard = async (cardId) => {
  const deletedCard = await PaymentCard.findByIdAndDelete(cardId);
  if (!deletedCard) {
    return null; // Or throw an error if preferred
  }
  return {
    id: deletedCard.id,
    type: deletedCard.type,
    lastFour: deletedCard.lastFour,
    holderName: deletedCard.holderName,
    expiryDate: deletedCard.expiryDate,
    isDefault: deletedCard.isDefault,
  };
};

module.exports = {
  changeUserCurrency,
  getUserCards,
  addPaymentCard,
  setDefaultPaymentCard,
  removePaymentCard,
};
