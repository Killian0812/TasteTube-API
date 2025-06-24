const Address = require("../models/address.model");
const { Product, productPopulate } = require("../models/product.model");
const DeliveryOption = require("../models/deliveryOption.model");
const { calculateDistanceBetweenAddress } = require("./location.service");

async function getProductsInShop(shopId, userId) {
  const products = await Product.find({ userId: shopId }).populate(
    productPopulate
  );
  const deliveryOption = await DeliveryOption.findOne({
    shopId: shopId,
    address: { $ne: null },
  })
    .populate("address")
    .select("address")
    .lean();

  let distance = null;
  if (userId) {
    const customerAddress = await Address.findOne({
      userId: userId,
      isDefault: true,
    }).lean();

    if (customerAddress) {
      distance = await calculateDistanceBetweenAddress(
        customerAddress,
        deliveryOption.address
      );
    }
  }

  return { products, shopAddress: deliveryOption?.address, distance };
}

async function searchProductsInShop(shopId, keyword) {
  const products = await Product.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
    userId: shopId,
  }).populate(productPopulate);
  return products;
}

async function searchProducts(
  userId,
  keyword,
  page = 1,
  limit = 10,
  orderBy = "newest"
) {
  const query = {
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  };

  if (orderBy === "distance") {
    const customerAddress = await Address.findOne({
      userId: userId,
      isDefault: true,
    }).lean();
    if (!customerAddress) {
      throw new Error("You haven't set a default address yet");
    }
    return await _getClosestProductsByQuery(
      query,
      customerAddress,
      page,
      limit
    );
  }

  if (orderBy === "rating") {
    return await _getHighestRatingProductsByQuery(query, page, limit);
  }

  return await _getNewestProductsByQuery(query, page, limit);
}

// Order by can be "distance", "newest", "rating", etc.
async function getRecommendedProducts(
  userId,
  page = 1,
  limit = 10,
  orderBy = "distance"
) {
  if (orderBy === "newest") {
    return await _getNewestProducts(page, limit);
  }

  if (orderBy === "rating") {
    return await _getHighestRatingProducts(page, limit);
  }

  // Find the customer's default address
  const customerAddress = await Address.findOne({
    userId: userId,
    isDefault: true,
  }).lean();
  if (!customerAddress) {
    throw new Error("You haven't set a default address yet");
  }
  return await _getClosestProducts(customerAddress, page, limit);
}

async function _getNewestProducts(page = 1, limit = 10) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { updatedAt: -1 }, // Sort by newest products
  };

  // Default pagination
  return await Product.paginate({}, options);
}

async function _getHighestRatingProducts(page = 1, limit = 10) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { avgRating: -1 }, // Sort by highest rating
  };

  // Default pagination
  return await Product.paginate({}, options);
}

async function _getNewestProductsByQuery(query, page = 1, limit = 10) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { updatedAt: -1 }, // Sort by newest products
  };

  // Paginate with search query
  return await Product.paginate(query, options);
}

async function _getHighestRatingProductsByQuery(query, page = 1, limit = 10) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { avgRating: -1 },
  };

  return await Product.paginate(query, options);
}

async function _getClosestProductsByQuery(
  query,
  address,
  page = 1,
  limit = 10
) {
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [address.longitude, address.latitude],
        },
        distanceField: "distance",
        spherical: true,
        query: {
          ...query,
          location: { $exists: true },
        },
      },
    },
    { $sort: { distance: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        let: { catId: "$category" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$catId"] } } },
          { $project: { _id: 1, name: 1 } },
        ],
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        let: { uid: "$userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
          { $project: { _id: 1, image: 1, username: 1, phone: 1 } },
        ],
        as: "userId",
      },
    },
    { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
  ];

  const [results, totalCount] = await Promise.all([
    Product.aggregate(pipeline),
    Product.countDocuments({ ...query, location: { $exists: true } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    docs: results,
    totalDocs: totalCount,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
}

async function _getClosestProducts(address, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  // GeoNear aggregation
  const pipeline = [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [address.longitude, address.latitude],
        },
        distanceField: "distance",
        spherical: true,
        query: {
          location: { $exists: true },
        },
      },
    },
    { $sort: { distance: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        let: { catId: "$category" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$catId"] } } },
          { $project: { _id: 1, name: 1 } },
        ],
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        let: { uid: "$userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
          { $project: { _id: 1, image: 1, username: 1, phone: 1 } },
        ],
        as: "userId",
      },
    },
    { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
  ];

  const [results, totalCount] = await Promise.all([
    Product.aggregate(pipeline),
    Product.countDocuments({ location: { $exists: true } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    docs: results,
    totalDocs: totalCount,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
}

module.exports = {
  getRecommendedProducts,
  searchProducts,
  getProductsInShop,
  searchProductsInShop,
};
