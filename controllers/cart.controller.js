const logger = require("../logger");
const { Cart, CartItem } = require("../models/cart.model");
const DeliveryOption = require("../models/deliveryOption.model");
const Product = require("../models/product.model");
const Discount = require("../models/discount.model");
const { getSelfDeliveryFee } = require("../services/orderDelivery.service");

const addToCart = async (req, res) => {
  const userId = req.userId;
  const { productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (quantity <= 0) {
      return res
        .status(404)
        .json({ message: "Must select at least one product." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    let cartItem = null;
    for (let itemId of cart.items) {
      const existingItem = await CartItem.findById(itemId).populate({
        path: "product",
        populate: [
          {
            path: "category",
            select: "_id name",
          },
          {
            path: "userId",
            select: "_id image username phone",
          },
        ],
      });
      if (existingItem.product.equals(productId)) {
        cartItem = existingItem;
        break;
      }
    }

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.cost += product.cost * quantity;
      await cartItem.save();
    } else {
      cartItem = new CartItem({
        product: product._id,
        currency: product.currency,
        quantity: quantity,
        cost: product.cost * quantity,
      });
      await cartItem.save();
      await cartItem.populate({
        path: "product",
        populate: [
          {
            path: "category",
            select: "_id name",
          },
          {
            path: "userId",
            select: "_id image username phone",
          },
        ],
      });
      cart.items.push(cartItem);
    }

    await cart.save();

    return res.status(200).json({ cartItem });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

const updateItemQuantity = async (req, res) => {
  const userId = req.userId;
  const { cartItemId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (quantity <= 0) {
      return res
        .status(404)
        .json({ message: "Must select at least one product." });
    }

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    const itemId = cart.items.find((item) => item.toString() === cartItemId);

    if (!itemId) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    const cartItem = await CartItem.findById(itemId).populate({
      path: "product",
      populate: [
        {
          path: "category",
          select: "_id name",
        },
        {
          path: "userId",
          select: "_id image username phone",
        },
      ],
    });

    cartItem.quantity = quantity;
    cartItem.cost = cartItem.product.cost * quantity;
    await cartItem.save();

    return res.status(200).json({ cartItem });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

const removeFromCart = async (req, res) => {
  const userId = req.userId;
  const { cartItemId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.toString() === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    await CartItem.deleteOne({ _id: cartItemId });

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return res.status(200).json({ message: "Item removed from cart." });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

const getCart = async (req, res) => {
  const userId = req.userId;

  try {
    let cart = await Cart.findOne({ userId }).populate({
      path: "items",
      populate: {
        path: "product",
        populate: [
          {
            path: "category",
          },
          {
            path: "userId",
          },
        ],
      },
    });

    if (!cart) {
      cart = new Cart({ userId: userId, items: [] });
      await cart.save();
    }

    return res.status(200).json({ cart });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

const getOrderSummary = async (req, res) => {
  const userId = req.userId;
  const { selectedItems, address, discounts } = req.body;

  try {
    const cart = await Cart.findOne({ userId }).populate({
      path: "items",
      populate: {
        path: "product",
      },
    });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Group selected items by shopId
    const filteredItems = cart.items.filter((item) =>
      selectedItems.includes(item.id)
    );
    const groupedItems = filteredItems.reduce((acc, item) => {
      const shopId = item.product.userId._id.toString();
      if (!acc[shopId]) {
        acc[shopId] = [];
      }
      acc[shopId].push(item);
      return acc;
    }, {});

    const selectedDiscounts = await Discount.find({
      _id: { $in: discounts },
    });
    if (selectedDiscounts.length !== discounts.length) {
      return res.status(404).json({ message: "Discount not found" });
    }

    const groupedDiscounts = selectedDiscounts.reduce((acc, discount) => {
      const shopId = discount.shopId.toString();
      if (!acc[shopId]) {
        acc[shopId] = [];
      }
      acc[shopId].push(discount);
      return acc;
    }, {});

    const orderSummaryPromises = Object.entries(groupedItems).map(
      async ([shopId, items]) => {
        const deliveryOption = await DeliveryOption.findOne({
          shopId,
        }).populate("address");

        if (!deliveryOption) {
          return {
            shopId,
            message: `Shop hasn't set up delivery`,
          };
        }

        const deliveryFee = await getSelfDeliveryFee(deliveryOption, address);
        if (isNaN(deliveryFee)) {
          return {
            shopId,
            message: `Outside of delivery area`,
          };
        }

        // Calculate total item cost
        const totalItemCost = items.reduce((sum, item) => sum + item.cost, 0);

        // Calculate discount amount
        let discountAmount = 0;
        if (groupedDiscounts[shopId]) {
          for (const discount of groupedDiscounts[shopId]) {
            // Validate that the order contains at least one product from discount.productIds
            if (discount.productIds.length > 0) {
              const hasValidProduct = items.some((item) =>
                discount.productIds.includes(item.product._id.toString())
              );
              if (!hasValidProduct) {
                return res.status(400).json({
                  message: `Order doesn't contain any product eligible for the discount "${discount.name}"`,
                });
              }
            }

            if (
              discount.minOrderAmount &&
              totalItemCost < discount.minOrderAmount
            ) {
              return res
                .status(400)
                .json({ message: "Order doesn't meet minimum amount" });
            }

            if (discount.valueType === "fixed") {
              discountAmount += discount.value;
            } else if (discount.valueType === "percentage") {
              discountAmount += (totalItemCost * discount.value) / 100;
            }

            // Ensure discountAmount does not exceed totalItemCost
            discountAmount = Math.min(discountAmount, totalItemCost);
          }
        }

        const totalAmount = totalItemCost + deliveryFee - discountAmount;

        return {
          shopId,
          deliveryFee,
          discountAmount,
          totalAmount,
        };
      }
    );

    const orderSummary = await Promise.all(orderSummaryPromises);
    return res.status(200).json({ orderSummary });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  removeFromCart,
  updateItemQuantity,
  addToCart,
  getOrderSummary,
};
