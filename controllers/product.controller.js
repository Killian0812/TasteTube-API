const Category = require('../models/category.model');

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
    const name = req.body.category;

    try {
        const category = await Category.findByIdAndUpdate(
            categoryId, { name }, { new: true }
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
        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });
        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};


module.exports = { getCategories, addCategory, updateCategory, deleteCategory };