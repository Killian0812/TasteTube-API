const Category = require('../models/category.model');

const categories = async (req, res) => {
    const userId = req.body.userId;
    Category.find({
        userId: userId,
    }).then(categories => {
        return res.status(200).json(categories);
    }).catch(e => {
        return res.status(500).json({ message: e });
    })
}

module.exports = { categories }