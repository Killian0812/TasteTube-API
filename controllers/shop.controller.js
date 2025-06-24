const ShopService = require("../services/shop.service");

async function getRecommendedProducts(req, res) {
  const userId = req.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;

  try {
    const result = await ShopService.getRecommendedProducts(
      userId,
      pageNum,
      limitNum
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getProductsInShop(req, res) {
  const shopId = req.params.shopId;
  const userId = req.userId;
  try {
    const result = await ShopService.getProductsInShop(shopId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

async function searchProducts(req, res) {
  const userId = req.userId;
  const { keyword, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;

  try {
    const result = await ShopService.searchProducts(
      userId,
      keyword,
      pageNum,
      limitNum
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function searchProductsInShop(req, res) {
  const { keyword } = req.query;
  const shopId = req.params.shopId;

  try {
    const products = await ShopService.searchProductsInShop(shopId, keyword);
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
