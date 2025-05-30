const Product = require("../models/product.model");
const ShopService = require("../services/shop.service");

async function getRecommendedProducts(req, res) {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await ShopService.getRecommendedProducts(
      userId,
      page,
      limit
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getProductsInShop(req, res) {
  const userId = req.params.shopId;
  try {
    const products = await Product.find({ userId: userId })
      .populate("category", "_id name")
      .populate("userId", "_id image username phone");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

async function searchProducts(req, res) {
  const { keyword } = req.query;
  const { shopId } = req.params;

  try {
    const query = {
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    };

    if (shopId) {
      query.userId = shopId;
    }

    const products = await Product.find(query)
      .populate("category", "_id name")
      .populate("userId", "_id image username phone");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to search for products" });
  }
}

async function searchProductsInShop(req, res) {
  const { keyword } = req.query;
  const userId = req.params.shopId;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
      userId: userId,
    })
      .populate("category", "_id name")
      .populate("userId", "_id image username phone");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to search for products" });
  }
}

module.exports = {
  getRecommendedProducts,
  searchProducts,
  getProductsInShop,
  searchProductsInShop,
};
