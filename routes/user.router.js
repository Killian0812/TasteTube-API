const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const verifyJWT = require('../middlewares/verifyJWT');
const userController = require('../controllers/user.controller');

router.get('/:userId', userController.getUserInfo)
router.post('/:userId', verifyJWT, upload.single('image'), userController.updateUserInfo)
router.put('/:userId/change_password', verifyJWT, userController.changePassword)

module.exports = router;
