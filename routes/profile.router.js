const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const profileController = require('../controllers/profile.controller');

// has userId from verifyJWT middleware
router.get('/', profileController.getProfile)
router.post('/edit', upload.single('image'), profileController.editInfo)
router.post('/change_password', profileController.changePassword)

module.exports = router;
