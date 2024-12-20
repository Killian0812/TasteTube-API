const { Cart } = require("../models/cart.model");
const Order = require("../models/order.model");

// Create by Customer, modify by Shop

const createOrder = async (req, res) => {
  const userId = req.userId;
  const { selectedCartItems, addressId, paymentMethod, notes } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({ message: "Please select a payment method" });
  }
  if (!addressId) {
    return res.status(400).json({ message: "Invalid delivery address" });
  }

  try {
    const cart = await Cart.findOne({ userId }).populate({
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

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    // Filter out selected cart items
    const selectedItems = cart.items.filter((item) =>
      selectedCartItems.includes(item._id.toString())
    );

    if (selectedItems.length === 0) {
      return res.status(400).json({ message: "No items selected." });
    }

    // Group selected items by shopId
    const groupedItems = {};
    selectedItems.forEach((item) => {
      const shopId = item.product.userId._id.toString();
      if (!groupedItems[shopId]) {
        groupedItems[shopId] = [];
      }
      groupedItems[shopId].push(item);
    });

    // Create orders for each shop
    const orders = [];
    for (const [shopId, items] of Object.entries(groupedItems)) {
      // Calculate the total price for current shop order
      const total = items.reduce((sum, item) => {
        return sum + item.product.cost * item.quantity;
      }, 0);

      // Create single order
      const order = new Order({
        userId,
        shopId,
        total,
        address: addressId,
        products: items.map((item) => item.product._id),
        notes,
        paymentMethod,
      });

      await order.save();
      orders.push(order);
    }

    // Clear the selected items from user cart
    cart.items = cart.items.filter(
      (item) => !selectedCartItems.includes(item._id.toString())
    );
    await cart.save();

    return res.status(201).json({ message: "Orders created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCustomerOrder = async (req, res) => {
  const userId = req.userId;

  try {
    const orders = await Order.find({ userId: userId }).populate([
      {
        path: "products",
        populate: [
          {
            path: "category",
          },
          {
            path: "userId",
          },
        ],
      },
      {
        path: "address",
      },
    ]);

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getShopOrder = async (req, res) => {
  const userId = req.userId;

  try {
    const orders = await Order.find({ shopId: userId }).populate([
      {
        path: "products",
        populate: [
          {
            path: "category",
          },
          {
            path: "userId",
          },
        ],
      },
      {
        path: "address",
      },
    ]);

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getCustomerOrder, getShopOrder };
