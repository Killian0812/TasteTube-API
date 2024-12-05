const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const reviewController = require('../controllers/review.controller');

router.get('/:reviewId', reviewController.getReview)
router.post('/', upload.single('video'), reviewController.uploadReview)
router.delete('/:reviewId', reviewController.deleteReview)
// Video interactions
router.get('/:reviewId/comment', reviewController.getReviewComments);
router.post("/:reviewId/comment", reviewController.commentReview);
router.delete("/:reviewId/comment", reviewController.deleteComment);
router.post("/:reviewId/like", reviewController.likeReview);
router.delete("/:reviewId/like", reviewController.unlikeReview);

module.exports = router;
