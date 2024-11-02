const router = require('express').Router();
const productController = require('../controllers/product.controller');
const verifyJWT = require('../middlewares/verifyJWT');

router.get('/categories', verifyJWT, productController.getCategories)
router.post('/categories', verifyJWT, productController.addCategory);
router.put('/categories/:categoryId', verifyJWT, productController.updateCategory);
router.delete('/categories/:categoryId', verifyJWT, productController.deleteCategory);

module.exports = router;
