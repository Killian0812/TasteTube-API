const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/', authController.login)

router.post('/phone', authController.phoneAuth)

router.post('/otp', authController.phoneOtpVerify)

router.post('/google', authController.googleAuth)

router.post('/facebook', authController.facebookAuth)

router.post('/verify', authController.verifyToken)

router.post('/logout', authController.logout)

module.exports = router;
