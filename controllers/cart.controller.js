const { Cart, CartItem } = require("../models/cart.model");
const Product = require("../models/product.model");

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
    console.error(error);
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
    await cartItem.save();

    return res.status(200).json({ cartItem });
  } catch (error) {
    console.error(error);
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
