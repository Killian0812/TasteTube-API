const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const userController = require('../controllers/user.controller');
const verifyOwner = require('../middlewares/verifyOwner');

router.get('/:userId', userController.getUserInfo)
router.put('/:userId', verifyOwner, userController.updateUserInfo)
router.post('/:userId/edit', upload.single('image'), userController.updateUserInfo) // TODO: Change to /avatar
router.post('/:userId/change_password', userController.changePassword)

module.exports = router;
