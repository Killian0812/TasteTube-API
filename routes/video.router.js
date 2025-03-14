const router = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fieldSize: 50 * 1024 * 1024 },
});
const videoController = require("../controllers/video.controller");
const verifyJWT = require("../middlewares/verifyJWT");

router.get("/liked", verifyJWT(), videoController.getUserLikedVideos);
router.get("/review", verifyJWT(true), videoController.getUserTargetedReviews);
router.get("/:videoId", verifyJWT(true), videoController.getVideo);
router.post(
  "/",
  verifyJWT(),
  upload.single("video"),
  videoController.uploadVideo
);
router.delete("/:videoId", verifyJWT(), videoController.deleteVideo);

// Video interactions
router.get("/:videoId/comment", videoController.getVideoComments);
router.post("/:videoId/comment", verifyJWT(), videoController.commentVideo);
router.delete("/:videoId/comment", verifyJWT(), videoController.deleteComment);
router.post("/:videoId/like", verifyJWT(), videoController.likeVideo);
router.delete("/:videoId/unlike", verifyJWT(), videoController.unlikeVideo);
router.post("/:videoId/share", verifyJWT(), videoController.shareVideo);

module.exports = router;
