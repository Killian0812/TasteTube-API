const { Cart, CartItem, cartItemPopulate } = require("../models/cart.model");
const { Product } = require("../models/product.model");
const Discount = require("../models/discount.model");
const DeliveryOption = require("../models/deliveryOption.model");
const { getSelfDeliveryFee } = require("./orderDelivery.service");

// Helper to normalize toppings (compare by name only)
const _normalizeToppings = (t) =>
  [...t].sort((a, b) => a.name.localeCompare(b.name));

const addToCart = async (
  userId,
  { productId, quantity, size = null, toppings = [] }
) => {
  if (quantity <= 0) {
    return {
      status: 400,
      data: { message: "Must select at least one product." },
    };
  }

  const product = await Product.findById(productId);
  if (!product) {
    return { status: 404, data: { message: "Product not found." } };
  }

  let cart =
    (await Cart.findOne({ userId })) || new Cart({ userId, items: [] });

  const inputToppings = _normalizeToppings(toppings);

  let cartItem = null;
  for (const itemId of cart.items) {
    const existingItem = await CartItem.findById(itemId).populate(
      cartItemPopulate
    );
    if (
      existingItem &&
      existingItem.product.equals(productId) &&
      existingItem.size === size
    ) {
      const existingToppings = _normalizeToppings(existingItem.toppings || []);

      // Check if new cartItem having same topping to an existing one
      const sameToppings =
        inputToppings.length === existingToppings.length &&
        inputToppings.every((t, i) => t.name === existingToppings[i].name);

      if (sameToppings) {
        cartItem = existingItem;
        break;
      }
    }
  }

  // Calculate total cost
  const baseCost = product.cost;
  const extraToppingsCost = toppings.reduce(
    (sum, t) => sum + (t.extraCost || 0),
    0
  );

  const sizeOption = product.sizes?.find((s) => s.name === size);
  const sizeExtraCost = sizeOption?.extraCost || 0;

  const totalCost = (baseCost + sizeExtraCost + extraToppingsCost) * quantity;

  if (cartItem) {
    cartItem.quantity += quantity;
    cartItem.cost += totalCost;
    await cartItem.save();
  } else {
    cartItem = await CartItem.create({
      product: product._id,
      currency: product.currency,
      quantity,
      size,
      toppings,
      cost: totalCost,
    });
    await cartItem.populate(cartItemPopulate);
    cart.items.push(cartItem);
  }

  await cart.save();
  return { status: 200, data: { cartItem } };
};

const updateItemQuantity = async (userId, { cartItemId, quantity }) => {
  if (quantity <= 0) {
    return {
      status: 400,
      data: { message: "Must select at least one product." },
    };
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return { status: 404, data: { message: "Cart not found." } };
  }

  const itemId = cart.items.find((item) => item.toString() === cartItemId);
  if (!itemId) {
    return { status: 404, data: { message: "Item not found in cart." } };
  }

  const cartItem = await CartItem.findById(itemId).populate(cartItemPopulate);
  cartItem.quantity = quantity;
  cartItem.cost = cartItem.product.cost * quantity;
  await cartItem.save();

  return { status: 200, data: { cartItem } };
};

const removeFromCart = async (userId, { cartItemId }) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return { status: 404, data: { message: "Cart not found." } };
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.toString() === cartItemId
  );
  if (itemIndex === -1) {
    return { status: 404, data: { message: "Item not found in cart." } };
  }

  await CartItem.deleteOne({ _id: cartItemId });
  cart.items.splice(itemIndex, 1);
  await cart.save();

  return { status: 200, data: { message: "Item removed from cart." } };
};

const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate({
    path: "items",
    populate: cartItemPopulate,
  });

  if (!cart) {
    cart = new Cart({ userId, items: [] });
    await cart.save();
  }

  return { status: 200, data: { cart } };
};

const getOrderSummary = async (
  userId,
  { selectedItems, address, discounts }
) => {
  const cart = await Cart.findOne({ userId }).populate({
    path: "items",
    populate: cartItemPopulate,
  });
  if (!cart) return { status: 404, data: { message: "Cart not found" } };

  const filteredItems = cart.items.filter((item) =>
    selectedItems.includes(item.id)
  );
  const groupedItems = filteredItems.reduce((acc, item) => {
    const shopId = item.product.userId._id.toString();
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(item);
    return acc;
  }, {});

  const selectedDiscounts = await Discount.find({ _id: { $in: discounts } });
  if (selectedDiscounts.length !== discounts.length) {
    return { status: 404, data: { message: "Discount not found" } };
  }

  const groupedDiscounts = selectedDiscounts.reduce((acc, discount) => {
    const shopId = discount.shopId.toString();
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(discount);
    return acc;
  }, {});

  const orderSummary = [];

  for (const [shopId, items] of Object.entries(groupedItems)) {
    const deliveryOption = await DeliveryOption.findOne({ shopId }).populate(
      "address"
    );
    if (!deliveryOption) {
      return { status: 400, data: { message: "Shop hasn't set up delivery." } };
    }

    const deliveryFee = await getSelfDeliveryFee(deliveryOption, address);
    if (isNaN(deliveryFee)) {
      return { status: 400, data: { message: "Outside of delivery area." } };
    }

    const totalItemCost = items.reduce((sum, item) => sum + item.cost, 0);
    let totalDiscountAmount = 0;
    const discountDetails = {};

    if (groupedDiscounts[shopId]) {
      for (const discount of groupedDiscounts[shopId]) {
        const hasValidProduct =
          discount.productIds.length === 0 ||
          items.some((item) =>
            discount.productIds.includes(item.product._id.toString())
          );

        if (!hasValidProduct) {
          return {
            status: 400,
            data: {
              message: `Order doesn't contain any product eligible for the discount "${discount.name}"`,
            },
          };
        }

        if (
          discount.minOrderAmount &&
          totalItemCost < discount.minOrderAmount
        ) {
          return {
            status: 400,
            data: { message: "Order doesn't meet minimum amount" },
          };
        }

        let discountValue = 0;
        if (discount.valueType === "fixed") {
          discountValue = discount.value;
        } else if (discount.valueType === "percentage") {
          discountValue = (totalItemCost * discount.value) / 100;
        }

        discountValue = Math.min(
          discountValue,
          totalItemCost - totalDiscountAmount
        );
        discountDetails[discount._id.toString()] = discountValue;
        totalDiscountAmount += discountValue;
      }
    }

    const totalAmount = totalItemCost + deliveryFee - totalDiscountAmount;

    orderSummary.push({
      shopId,
      deliveryFee,
      discountDetails,
      totalDiscountAmount,
      totalAmount,
    });
  }

  return { status: 200, data: { orderSummary } };
};

module.exports = {
  addToCart,
  updateItemQuantity,
  removeFromCart,
  getCart,
  getOrderSummary,
};
