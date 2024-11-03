const Category = require('../models/category.model');
const Product = require('../models/product.model');
const { uploadToFirebaseStorage, deleteFromFirebaseStorage } = require('../services/storage.service');

const getCategories = async (req, res) => {
    const userId = req.userId;
    Category.find({
        userId: userId,
    }).then(categories => {
        return res.status(200).json(categories);
    }).catch(e => {
        return res.status(500).json({ message: e });
    })
}

const addCategory = async (req, res) => {
    const name = req.body.name;
    const userId = req.userId;

    try {
        const category = new Category({ name, userId });
        await category.save();
        return res.status(201).json(category);
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};

const updateCategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    const name = req.body.name;

    try {
        const category = await Category.findByIdAndUpdate(
            categoryId, { name: name }, { new: true }
        );
        if (!category) return res.status(404).json({ message: "Category not found" });
        return res.status(200).json(category);
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};

const deleteCategory = async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const products = await Product.find({ category: categoryId });

        await Promise.all(products.map(async (product) => {
            await Promise.all(product.images.map(async (image) => {
                await deleteFromFirebaseStorage(image.filename);
            }));

            await Product.findByIdAndDelete(product._id);
        }));

        await Category.findByIdAndDelete(category._id);

        return res.status(200).json({ message: "Category and associated products deleted successfully" });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: 'Product owner is required' });
        }
        const products = await Product.find({ userId: userId }).populate('category');
        return res.status(200).json(products);
    } catch (err) {
        return res.status(500).json({ message: err });
    }
};

const getProduct = async (req, res) => {
    const { productId } = req.params;
    if (!productId) {
        return res.status(400).json({ message: 'Product not found' });
    }
    try {
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching product', error: err });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, cost, currency, description, quantity, category } = req.body;
        if (!name || !cost || !quantity) {
            return res.status(400).json({ message: "Missing required information" });
        }
        if (!req.files)
            return res.status(400).json({ message: "Please upload at least 1 product image" });

        const images = await Promise.all(req.files.map(async (file) => {
            const { url, filename } = await uploadToFirebaseStorage(file);
            return { url, filename };
        }));

        const newProduct = new Product({
            userId: req.userId,
            name,
            cost,
            currency,
            description,
            quantity,
            category,
            images
        });
        await newProduct.save();
        return res.status(201).json(newProduct);
    } catch (err) {
        return res.status(500).json({ message: err });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, cost, currency, description, quantity, category, removeImages } = req.body;
        const product = await Product.findById(req.params.productId);
        if (!product || product.userId.toString() !== req.userId) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.name = name || product.name;
        product.cost = cost || product.cost;
        product.currency = currency || product.currency;
        product.description = description || product.description;
        product.quantity = quantity || product.quantity;
        product.category = category || product.category;

        if (!req.files && removeImages.length == product.images.length) {
            return res.status(400).json({ message: "Product must have at least 1 image" });
        }

        if (removeImages.length > 0) {
            await Promise.all(removeImages.map(async (filename) => {
                await deleteFromFirebaseStorage(filename);
            }));
        }

        const newImages = await Promise.all(req.files.map(async (file) => {
            const { url, filename } = await uploadToFirebaseStorage(file);
            return { url, filename };
        }));
        product.images = [...product.images, ...newImages];

        await product.save();
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (product.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Permission denied' });
        }
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await Promise.all(product.images.map(async (image) => {
            await deleteFromFirebaseStorage(image.filename);
        }));
        await product.remove();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting product', error: err });
    }
};

module.exports = {
    getCategories, addCategory, updateCategory, deleteCategory,
    getProducts, getProduct, createProduct, updateProduct, deleteProduct
};