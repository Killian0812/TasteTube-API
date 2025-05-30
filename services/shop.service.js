const Address = require("../models/address.model");
const Product = require("../models/product.model");
const DeliveryOption = require("../models/deliveryOption.model");
const {
  calculateDistanceBetweenAddress,
} = require("../services/location.service");

async function searchProducts(userId, keyword, page = 1, limit = 10) {
  const query = {
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  };

  // Find the customer’s default address
  const customerAddress = await Address.findOne({
    userId: userId,
    isDefault: true,
  }).lean();

  if (!customerAddress) {
    return await _getNewestProductsByQuery(query, page, limit);
  }

  return await _getClosestProductsByQuery(query, customerAddress, page, limit);
}

async function getRecommendedProducts(userId, page = 1, limit = 10) {
  // Find the customer's default address
  const customerAddress = await Address.findOne({
    userId: userId,
    isDefault: true,
  }).lean();

  if (!customerAddress) {
    return await _getNewestProducts(page, limit);
  }

  return await _getClosestProducts(customerAddress, page, limit);
}

async function _getNewestProducts(page = 1, limit = 10) {
  const options = {
    page: page,
    limit: limit,
    populate: [
      { path: "category", select: "_id name" },
      { path: "userId", select: "_id image username phone" },
    ],
    lean: true,
    sort: { updatedAt: -1 }, // Sort by newest products
  };

  // Default pagination
  return await Product.paginate({}, options);
}

async function _getNewestProductsByQuery(query, page = 1, limit = 10) {
  const options = {
    page: page,
    limit: limit,
    populate: [
      { path: "category", select: "_id name" },
      { path: "userId", select: "_id image username phone" },
    ],
    lean: true,
    sort: { updatedAt: -1 }, // Sort by newest products
  };

  // Paginate with search query
  return await Product.paginate(query, options);
}

async function _getClosestProductsByQuery(
  query,
  address,
  page = 1,
  limit = 10
) {
  const products = await Product.find(query)
    .populate("category", "_id name")
    .populate("userId", "_id image username phone")
    .lean();

  // Get distances for products based on shop delivery settings
  const productsWithDistance = await _getProductWithShopDistances(
    products,
    address
  );

  // Manual pagination
  const paginatedProducts = productsWithDistance.slice(
    (page - 1) * limit,
    page * limit
  );
  const totalProducts = productsWithDistance.length;
  const totalPages = Math.ceil(totalProducts / limit);

  return {
    docs: paginatedProducts,
    totalDocs: totalProducts,
    limit: limit,
    page: page,
    totalPages: totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
}

async function _getClosestProducts(address, page = 1, limit = 10) {
  const products = await Product.find()
    .populate("category", "_id name")
    .populate("userId", "_id image username phone")
    .lean();

  // Get distances for products based on shop delivery settings
  const productsWithDistance = await _getProductWithShopDistances(
    products,
    address
  );

  // Manual pagination
  const paginatedProducts = productsWithDistance.slice(
    (page - 1) * limit,
    page * limit
  );
  const totalProducts = productsWithDistance.length;
  const totalPages = Math.ceil(totalProducts / limit);

  return {
    docs: paginatedProducts,
    totalDocs: totalProducts,
    limit: limit,
    page: page,
    totalPages: totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
}

async function _getProductWithShopDistances(products, customerAddress) {
  // Get unique shop userIds from products
  const shopIds = [
    ...new Set(products.map((product) => product.userId._id.toString())),
  ];

  // Fetch delivery addresses for all shops
  const shopDeliveryOptions = await DeliveryOption.find({
    shopId: { $in: shopIds },
    address: { $ne: null },
  })
    .populate("address")
    .select("address")
    .lean();

  // Create a map of shopId to their address
  const addressMap = shopDeliveryOptions.reduce((map, option) => {
    map[option.address.userId.toString()] = option.address;
    return map;
  }, {});

  // Calculate distance for each product based on shop’s shop's address
  const productsWithDistance = await Promise.all(
    products
      .filter((product) => addressMap[product.userId._id.toString()])
      .map(async (product) => {
        const shopAddress = addressMap[product.userId._id.toString()];
        const distance = await calculateDistanceBetweenAddress(
          customerAddress,
          shopAddress
        );
        return { ...product, distance, shopAddress };
      })
  );

  return productsWithDistance.sort((a, b) => a.distance - b.distance);
}

module.exports = { getRecommendedProducts, searchProducts };
