const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/', authController.login)

router.post('/google', authController.googleLogin)

router.post('/verify', authController.verifyToken)

module.exports = router;
