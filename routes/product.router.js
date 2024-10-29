const router = require('express').Router();
const productController = require('../controllers/product.controller');
const verifyJWT = require('../middlewares/verifyJWT');

router.get('/categories', verifyJWT, productController.categories)

module.exports = router;
