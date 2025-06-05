const Category = require("../models/category.model");
const { Product, productPopulate } = require("../models/product.model");
const User = require("../models/user.model");
const {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
} = require("../services/storage.service");

const getCategoriesForUser = async (userId) => {
  return await Category.find({ userId: userId });
};

const createCategory = async (name, userId) => {
  const category = new Category({ name, userId });
  await category.save();
  return category;
};

const updateCategoryById = async (categoryId, name) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    { name: name },
    { new: true }
  );
  return category;
};

const deleteCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    return null; // Category not found
  }

  const products = await Product.find({ category: categoryId });

  // Delete associated product images from storage
  await Promise.all(
    products.map(async (product) => {
      await Promise.all(
        product.images.map(async (image) => {
          await deleteFromFirebaseStorage(image.filename);
        })
      );
      // Delete the product itself
      await Product.findByIdAndDelete(product._id);
    })
  );

  // Finally, delete the category
  await Category.findByIdAndDelete(category._id);
  return true; // Indicates successful deletion
};

const getProductsByUserId = async (userId) => {
  const products = await Product.find({ userId: userId }).populate(
    productPopulate
  );
  return products;
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId).populate(productPopulate);
  return product;
};

const createNewProduct = async (productData, files, userId) => {
  const {
    name,
    cost,
    description,
    quantity,
    prepTime,
    category,
    ship,
    sizes,
    toppings,
  } = productData;

  if (!name || !cost || !quantity) {
    throw new Error("Missing required information for product creation.");
  }
  if (!files || files.length === 0) {
    throw new Error("Please upload at least 1 product image.");
  }

  const images = await Promise.all(
    files.map(async (file) => {
      const { url, filename } = await uploadToFirebaseStorage(file);
      return { url, filename };
    })
  );

  const shop = await User.findById(userId);

  const newProduct = new Product({
    userId,
    name,
    cost,
    currency: shop.currency ?? "VND",
    description,
    quantity,
    prepTime,
    category,
    images,
    ship,
    sizes: Array.isArray(sizes) ? sizes : [],
    toppings: Array.isArray(toppings) ? toppings : [],
  });
  await newProduct.save().then((t) => t.populate(["category", "userId"]));
  return newProduct;
};

const updateProductById = async (productId, userId, updateData, files) => {
  const {
    name,
    cost,
    currency,
    description,
    quantity,
    prepTime,
    ship,
    category,
    reordered_images,
    sizes,
    toppings,
  } = updateData;

  const product = await Product.findById(productId);

  if (!product || product.userId.toString() !== userId) {
    return null;
  }

  product.name = name ?? product.name;
  product.cost = cost ?? product.cost;
  product.currency = currency ?? product.currency;
  product.description = description ?? product.description;
  product.quantity = quantity ?? product.quantity;
  product.prepTime = prepTime ?? product.prepTime;
  product.category = category ?? product.category;
  product.ship = ship ?? product.ship;
  product.images = reordered_images ?? product.images;

  if (Array.isArray(sizes)) {
    product.sizes = sizes;
  }

  if (Array.isArray(toppings)) {
    product.toppings = toppings;
  }

  if (files && files.length > 0) {
    const newImages = await Promise.all(
      files.map(async (file) => {
        const { url, filename } = await uploadToFirebaseStorage(file);
        return { url, filename };
      })
    );
    product.images.push(...newImages);
  }

  await product.save().then((t) => t.populate(productPopulate));
  return product;
};

const deleteProductImage = async (productId, userId, filename) => {
  const product = await Product.findById(productId);

  if (!product) {
    return "Product not found"; // Specific message for controller
  }
  if (product.userId.toString() !== userId) {
    return "Permission denied"; // Specific message for controller
  }

  const imageIndex = product.images.findIndex(
    (image) => image.filename === filename
  );
  if (imageIndex === -1) {
    return "Image not found in product"; // Specific message for controller
  }

  await deleteFromFirebaseStorage(filename);
  product.images.splice(imageIndex, 1);
  await product.save();

  return true; // Indicates success
};

const deleteProductAndImages = async (productId, userId) => {
  const product = await Product.findById(productId);

  if (!product) {
    return "Product not found"; // Specific message for controller
  }
  if (product.userId.toString() !== userId) {
    return "Permission denied"; // Specific message for controller
  }

  await Promise.all(
    product.images.map(async (image) => {
      await deleteFromFirebaseStorage(image.filename);
    })
  );

  await Product.findByIdAndDelete(productId);
  return true; // Indicates success
};

module.exports = {
  getCategoriesForUser,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  getProductsByUserId,
  getProductById,
  createNewProduct,
  updateProductById,
  deleteProductImage,
  deleteProductAndImages,
};
