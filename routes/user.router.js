const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const userController = require('../controllers/user.controller');

router.get('/:userId', userController.handleGetUserInfo)
module.exports = router;
