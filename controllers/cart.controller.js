const { Cart } = require("../models/cart.model");
const Product = require("../models/product.model");

const addToCart = async (req, res) => {
  const userId = req.userId;
  const { productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

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

    // Check if the product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      if (existingItem.quantity <= 0) {
        // Remove if qty <= 0
        cart.items = cart.items.filter(
          (item) => item.product.toString() !== productId
        );
      }
    } else {
      cart.items.push({
        product: productId,
        quantity: quantity > 0 ? quantity : 1,
      });
    }

    await cart.save();

    return res.status(200).json({ message: "Cart updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

const updateItemQuantity = async (req, res) => {
  const userId = req.userId;
  const { productId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    // Update the quantity or remove the item if quantity is zero
    if (quantity > 0) {
      item.quantity = quantity;
    } else {
      // Remove the item if quantity is zero or less
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
    }

    await cart.save();

    return res.status(200).json({ message: "Cart updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

const removeFromCart = async (req, res) => {
  const userId = req.userId;
  const { productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({ message: "Item removed from cart." });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return res.status(500).json({ message: "An error occurred." });
  }
};

module.exports = { getCart, removeFromCart, updateItemQuantity, addToCart };
