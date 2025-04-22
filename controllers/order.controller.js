const { Cart } = require("../models/cart.model");
const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const Discount = require("../models/discount.model");
const { sendFcmNotification } = require("../services/fcm.service");
const logger = require("../logger");

// Create by Customer, modify by Shop
const createOrder = async (req, res) => {
  const userId = req.userId;
  const {
    selectedCartItems,
    addressId,
    paymentMethod,
    notes,
    pid,
    orderSummary,
    discounts,
    appliedDiscountDetails,
  } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({ message: "Please select a payment method" });
  }
  if (!addressId) {
    return res.status(400).json({ message: "Invalid delivery address" });
  }
  if (paymentMethod !== "COD" && paymentMethod !== "CARD" && !pid) {
    return res.status(400).json({ message: "Payment invalid" });
  }

  try {
    let payment = null;
    if (pid) {
      payment = await Payment.findById(pid);
      if (!payment || payment.status !== "paid") {
        return res
          .status(400)
          .json({ message: "Must pay before creating order" });
      }
    }

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

    const selectedDiscounts = await Discount.find({
      _id: { $in: discounts },
    });

    const groupedDiscounts = selectedDiscounts.reduce((acc, discount) => {
      const shopId = discount.shopId.toString();
      if (!acc[shopId]) {
        acc[shopId] = [];
      }
      acc[shopId].push(discount);
      return acc;
    }, {});

    // Create orders for each shop
    const orders = [];
    for (const [shopId, items] of Object.entries(groupedItems)) {
      // Get total price for current shop from orderSummary
      const currentShopOrderSummary = orderSummary.find(
        (summary) => summary.shopId === shopId
      );

      const total = currentShopOrderSummary["totalAmount"];
      const deliveryFee = currentShopOrderSummary["deliveryFee"];
      const shopDiscounts = groupedDiscounts[shopId] || [];
      const shopDiscountsWithAmount = shopDiscounts.map((discount) => {
        const discountAmount = appliedDiscountDetails[discount._id.toString()];
        return {
          discountId: discount._id,
          amount: discountAmount || 0,
        };
      });

      // Create single order
      const order = new Order({
        userId,
        shopId,
        total,
        address: addressId,
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        notes,
        paymentMethod,
        deliveryFee,
        discounts: shopDiscountsWithAmount,
      });
      if (payment) {
        order.paid = payment.status === "paid";
        order.paymentId = payment._id;
      }
      if (paymentMethod === "CARD") {
        order.paid = true;
      }

      await order.save();

      setTimeout(async () => {
        await sendFcmNotification({
          userId: shopId,
          title: "You have a new order from TasteTube Shop.",
          body: `Total order cost: ${total} ${
            items[0].currency
          }. Payment status: ${order.paid ? "Paid" : "Unpaid"}.`,
          data: {
            type: "order.new",
          },
        });
      }, 1);

      // Update discount user usages
      setTimeout(async () => {
        try {
          for (const discount of shopDiscounts) {
            const userUsage = discount.userUsages.find(
              (usage) => usage.userId.toString() === userId
            );
            if (userUsage) {
              userUsage.count += 1;
            } else {
              discount.userUsages.push({ userId, count: 1 });
            }
            await discount.save();
            logger.info(`Discount usages ${discount.id} updated successfully.`);
          }
        } catch (error) {
          logger.error("Error updating discount usages:", error);
        }
      }, 1);

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
        path: "items",
        populate: [
          {
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
        ],
      },
      {
        path: "address",
      },
      {
        path: "userId",
        select: "_id phone email username image",
      },
      {
        path: "discounts.discountId",
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
        path: "items",
        populate: [
          {
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
        ],
      },
      {
        path: "address",
      },
      {
        path: "userId",
        select: "_id phone email username image",
      },
      {
        path: "discounts.discountId",
      },
    ]);

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const newStatus = req.body.newStatus;
  const id = req.params.id;

  if (!newStatus) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findById(id).populate([
      {
        path: "items",
        populate: [
          {
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
        ],
      },
      {
        path: "address",
      },
      {
        path: "userId",
        select: "_id phone email username image",
      },
      {
        path: "discounts.discountId",
      },
    ]);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = newStatus;
    if (newStatus === 'COMPLETED' && order.paymentMethod === 'COD') {
      order.paid = true;
    }
    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateOrderFeedback = async (req, res) => {
  const id = req.params.id;
  const { feedback, ratings } = req.body;

  try {
    const order = await Order.findById(id).populate([
      {
        path: "items",
        populate: [
          {
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
        ],
      },
      {
        path: "address",
      },
      {
        path: "userId",
        select: "_id phone email username image",
      },
      {
        path: "discounts.discountId",
      },
    ]);

    order.feedback = feedback;

    // Update ratings for CartItems
    if (ratings) {
      for (var i = 0; i < order.items.length; i++)
        order.items[i].rating = ratings[order.items[i].product.id];
    }

    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getCustomerOrder,
  getShopOrder,
  updateOrderStatus,
  updateOrderFeedback,
};
