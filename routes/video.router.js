const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const videoController = require('../controllers/video.controller');

router.get('/:videoId', videoController.getVideo)
router.post('/', upload.single('video'), videoController.uploadVideo)
router.delete('/:videoId', videoController.deleteVideo)

module.exports = router;
