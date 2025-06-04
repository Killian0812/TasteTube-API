const paymentOptionService = require("../services/paymentOption.service");

const changeCurrency = async (req, res) => {
  try {
    const updatedCurrency = await paymentOptionService.changeUserCurrency(
      req.userId,
      req.body.currency
    );
    return res.status(200).json({
      updatedCurrency: updatedCurrency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCards = async (req, res) => {
  try {
    const cards = await paymentOptionService.getUserCards(req.userId);
    return res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCard = async (req, res) => {
  try {
    const newCard = await paymentOptionService.addPaymentCard(
      req.userId,
      req.body
    );
    return res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const setDefaultCard = async (req, res) => {
  try {
    const updatedCard = await paymentOptionService.setDefaultPaymentCard(
      req.userId,
      req.params.cardId
    );

    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    return res.status(200).json(updatedCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCard = async (req, res) => {
  try {
    const deletedCard = await paymentOptionService.removePaymentCard(
      req.params.cardId
    );
    if (!deletedCard) {
      return res.status(404).json({ message: "Card not found" });
    }
    return res.status(200).json(deletedCard);
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
