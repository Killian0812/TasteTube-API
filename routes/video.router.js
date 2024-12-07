const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const videoController = require('../controllers/video.controller');

router.get('/liked', videoController.getUserLikedVideos)
router.get('/review', videoController.getUserTargetedReviews)
router.get('/:videoId', videoController.getVideo)
router.post('/', upload.single('video'), videoController.uploadVideo)
router.delete('/:videoId', videoController.deleteVideo)
// Video interactions
router.get('/:videoId/comment', videoController.getVideoComments);
router.post("/:videoId/comment", videoController.commentVideo);
router.delete("/:videoId/comment", videoController.deleteComment);
router.post("/:videoId/like", videoController.likeVideo);
router.delete("/:videoId/unlike", videoController.unlikeVideo);

module.exports = router;
