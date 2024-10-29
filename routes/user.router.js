const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const userController = require('../controllers/user.controller');
const profileController = require('../controllers/profile.controller');
const verifyOwner = require('../middlewares/verifyOwner');

router.get('/:userId', userController.getUserInfo)
router.put('/:userId', verifyOwner, userController.updateUserInfo)
// TODO: Merge to userController
router.post('/:userId/edit', upload.single('image'), profileController.editInfo) // TODO: Change to /avatar
router.post('/:userId/change_password', profileController.changePassword)

module.exports = router;
