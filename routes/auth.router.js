const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/', authController.handleLogin)

router.post('/google', authController.handleGoogleLogin)

router.post('/verify', authController.handleVerifyToken)

module.exports = router;