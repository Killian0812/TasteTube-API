const router = require('express').Router();
const refreshTokenController = require('../controllers/refreshToken.controller');

router.post('/', refreshTokenController.handleRefreshToken);

module.exports = router;
