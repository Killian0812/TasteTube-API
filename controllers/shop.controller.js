const Product = require("../models/product.model");

async function getRecommendedProducts(req, res) {
  try {
    const products = await Product.find()
      .populate("category", "_id name")
      .populate("userId", "_id image username phone");

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
