const Product = require("../models/product.model");

async function getRecommendedProducts(req, res) {
  try {
    const products = await Product.find()
      .populate("category", "_id name")
      .populate("userId", "_id image username");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

async function getProductsInShop(req, res) {
  const userId = req.params.shopId;
  try {
    const products = await Product.find({ userId: userId })
      .populate("category", "_id name")
      .populate("userId", "_id image username");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

async function searchProducts(req, res) {
  const { keyword } = req.query;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    })
      .populate("category", "_id name")
      .populate("userId", "_id image username");

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
      .populate("userId", "_id image username");

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
