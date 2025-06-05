const { Cart, cartItemPopulate } = require("../models/cart.model");
const { Order, orderPopulate } = require("../models/order.model");
const Payment = require("../models/payment.model");
const Discount = require("../models/discount.model");
const { sendFcmNotification } = require("./fcm.service");
const logger = require("../core/logger");

const createOrder = async (userId, body) => {
  const {
    selectedCartItems,
    addressId,
    paymentMethod,
    notes,
    pid,
    orderSummary,
    discounts,
    appliedDiscountDetails,
  } = body;

  if (!paymentMethod)
    throw { status: 400, message: "Please select a payment method" };
  if (!addressId) throw { status: 400, message: "Invalid delivery address" };
  if (paymentMethod !== "COD" && paymentMethod !== "CARD" && !pid) {
    throw { status: 400, message: "Payment invalid" };
  }

  let payment = null;
  if (pid) {
    payment = await Payment.findById(pid);
    if (!payment || payment.status !== "paid") {
      throw { status: 400, message: "Must pay before creating order" };
    }
  }

  const cart = await Cart.findOne({ userId }).populate({
    path: "items",
    populate: cartItemPopulate,
  });
  if (!cart || cart.items.length === 0)
    throw { status: 400, message: "Your cart is empty." };

  const selectedItems = cart.items.filter((item) =>
    selectedCartItems.includes(item._id.toString())
  );
  if (selectedItems.length === 0)
    throw { status: 400, message: "No items selected." };

  const groupedItems = {};
  selectedItems.forEach((item) => {
    const shopId = item.product.userId._id.toString();
    if (!groupedItems[shopId]) groupedItems[shopId] = [];
    groupedItems[shopId].push(item);
  });

  const selectedDiscounts = await Discount.find({ _id: { $in: discounts } });
  const groupedDiscounts = selectedDiscounts.reduce((acc, discount) => {
    const shopId = discount.shopId.toString();
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(discount);
    return acc;
  }, {});

  const orders = [];
  for (const [shopId, items] of Object.entries(groupedItems)) {
    const summary = orderSummary.find((s) => s.shopId === shopId);
    const total = summary.totalAmount;
    const deliveryFee = summary.deliveryFee;
    const shopDiscounts = groupedDiscounts[shopId] || [];
    const discountDetails = shopDiscounts.map((d) => ({
      discountId: d._id,
      amount: appliedDiscountDetails[d._id.toString()] || 0,
    }));

    const order = new Order({
      userId,
      shopId,
      total,
      address: addressId,
      items: items.map((i) => ({
        product: i.product._id,
        quantity: i.quantity,
      })),
      notes,
      paymentMethod,
      deliveryFee,
      discounts: discountDetails,
    });

    if (payment) {
      order.paid = true;
      order.paymentId = payment._id;
    } else if (paymentMethod === "CARD") {
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
        data: { type: "order.new" },
      });
    }, 1);

    setTimeout(async () => {
      try {
        for (const discount of shopDiscounts) {
          const userUsage = discount.userUsages.find(
            (u) => u.userId.toString() === userId
          );
          if (userUsage) userUsage.count += 1;
          else discount.userUsages.push({ userId, count: 1 });
          await discount.save();
          logger.info(`Discount usages ${discount.id} updated successfully.`);
        }
      } catch (err) {
        logger.error("Error updating discount usages:", err);
      }
    }, 1);

    orders.push(order);
  }

  cart.items = cart.items.filter(
    (item) => !selectedCartItems.includes(item._id.toString())
  );
  await cart.save();

  return { message: "Orders created successfully" };
};

const getCustomerOrders = async (userId) => {
  return await Order.find({ userId }).populate(orderPopulate);
};

const getShopOrders = async (userId) => {
  return await Order.find({ shopId: userId }).populate(orderPopulate);
};

const updateOrderStatus = async (id, newStatus, cancelReason, userId) => {
  if (!newStatus) throw { status: 400, message: "Invalid status" };

  const order = await Order.findById(id).populate(orderPopulate);
  if (!order) throw { status: 404, message: "Order not found" };

  if (newStatus === "COMPLETED" && order.paymentMethod === "COD") {
    order.paid = true;
  }

  if (newStatus === "CANCELED") {
    if (order.status === "COMPLETED") {
      throw { status: 400, message: "Cannot cancel completed order" };
    }

    const lastLog = order.deliveryStatusLog.at(-1);
    if (lastLog) {
      if (lastLog.deliveryStatus === "COMPLETED") {
        throw { status: 400, message: "Cannot cancel completed order" };
      }
      if (!["FAILED", "RETURNED"].includes(lastLog.deliveryStatus)) {
        throw { status: 400, message: "Cannot cancel order in delivery" };
      }
    }

    order.cancelBy =
      order.shopId.toString() === userId ? "RESTAURANT" : "CUSTOMER";
    order.cancelReason = cancelReason ?? "No reason provided";
  }

  if (order.status === "CANCELED" && newStatus !== "CANCELED") {
    order.cancelReason = undefined;
    order.cancelBy = undefined;
  }

  order.status = newStatus;
  await order.save();
  return order;
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getShopOrders,
  updateOrderStatus,
};
