const Address = require("../models/address.model");
const {
  Product,
  productPopulate,
  productAggregatePopulate,
} = require("../models/product.model");
const DeliveryOption = require("../models/deliveryOption.model");
const {
  calculateDistanceBetweenAddress,
  calculateHaversineDistance,
} = require("./location.service");

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
    return await _getHighestRatingProductsByQuery(query, page, limit, userId);
  }

  return await _getNewestProductsByQuery(query, page, limit, userId);
}

// Order by can be "distance", "newest", "rating", etc.
async function getRecommendedProducts(
  userId,
  page = 1,
  limit = 10,
  orderBy = "distance"
) {
  if (orderBy === "newest") {
    return await _getNewestProducts(page, limit, userId);
  }

  if (orderBy === "rating") {
    return await _getHighestRatingProducts(page, limit, userId);
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

async function _getNewestProducts(page = 1, limit = 10, userId) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { updatedAt: -1 }, // Sort by newest products
  };

  // Default pagination
  const result = await Product.paginate({}, options);
  result.docs = await _appendDistanceToProducts(result.docs, userId);
  return result;
}

async function _getHighestRatingProducts(page = 1, limit = 10, userId) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { avgRating: -1 }, // Sort by highest rating
  };

  // Default pagination
  const result = await Product.paginate({}, options);
  result.docs = await _appendDistanceToProducts(result.docs, userId);
  return result;
}

async function _getNewestProductsByQuery(query, page = 1, limit = 10, userId) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { updatedAt: -1 }, // Sort by newest products
  };

  // Paginate with search query
  const result = await Product.paginate(query, options);
  result.docs = await _appendDistanceToProducts(result.docs, userId);
  return result;
}

async function _getHighestRatingProductsByQuery(
  query,
  page = 1,
  limit = 10,
  userId
) {
  const options = {
    page: page,
    limit: limit,
    populate: productPopulate,
    lean: true,
    sort: { avgRating: -1 },
  };

  const result = await Product.paginate(query, options);
  result.docs = await _appendDistanceToProducts(result.docs, userId);
  return result;
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
    ...productAggregatePopulate,
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

async function _appendDistanceToProducts(products, userId) {
  const customerAddress = await Address.findOne({
    userId: userId,
    isDefault: true,
  }).lean();

  if (!customerAddress) return products;

  const productsWithDistance = products.map((product) => {
    if (!product?.location) return product;

    const distance = calculateHaversineDistance({
      lng1: customerAddress.longitude,
      lat1: customerAddress.latitude,
      lng2: product.location.coordinates[0],
      lat2: product.location.coordinates[1],
      unit: "m",
    });

    return {
      ...product,
      distance,
    };
  });

  return productsWithDistance;
}

module.exports = {
  getRecommendedProducts,
  searchProducts,
  getProductsInShop,
  searchProductsInShop,
};
