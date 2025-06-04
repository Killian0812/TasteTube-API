const productService = require("../services/product.service");

const getCategories = async (req, res) => {
  try {
    const categories = await productService.getCategoriesForUser(req.userId);
    return res.status(200).json(categories);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const addCategory = async (req, res) => {
  const { name } = req.body;
  const userId = req.userId;

  try {
    const category = await productService.createCategory(name, userId);
    return res.status(201).json(category);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { name } = req.body;

  try {
    const category = await productService.updateCategoryById(categoryId, name);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(category);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const success = await productService.deleteCategoryById(categoryId);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({
      message: "Category and associated products deleted successfully",
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "Product owner is required" });
    }
    const products = await productService.getProductsByUserId(userId);
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getProduct = async (req, res) => {
  const { productId } = req.params;
  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }
  try {
    const product = await productService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const newProduct = await productService.createNewProduct(
      req.body,
      req.files,
      req.userId
    );
    return res.status(201).json(newProduct);
  } catch (err) {
    if (
      err.message === "Missing required information for product creation." ||
      err.message === "Please upload at least 1 product image."
    ) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await productService.updateProductById(
      req.params.productId,
      req.userId,
      req.body,
      req.files
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: "Product not found or permission denied" });
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSingleProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { filename } = req.body;

    const result = await productService.deleteProductImage(
      productId,
      req.userId,
      filename
    );

    if (result === "Product not found") {
      return res.status(404).json({ message: result });
    }
    if (result === "Permission denied") {
      return res.status(403).json({ message: result });
    }
    if (result === "Image not found in product") {
      return res.status(400).json({ message: result });
    }

    return res
      .status(200)
      .json({ message: "Product image deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await productService.deleteProductAndImages(
      productId,
      req.userId
    );

    if (result === "Product not found") {
      return res.status(404).json({ message: result });
    }
    if (result === "Permission denied") {
      return res.status(403).json({ message: result });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  deleteSingleProductImage,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
