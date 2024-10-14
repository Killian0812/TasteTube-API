const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const profileController = require('../controllers/profile.controller');

// has userId from verifyJWT middleware
router.get('/', profileController.handleGetProfile)
router.post('/edit', upload.single('image'), profileController.handleEditInfo)
router.post('/change_password', profileController.handleChangePassword)

module.exports = router;
