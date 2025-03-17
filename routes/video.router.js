const router = require("express").Router();
const { uploadPath } = require("../utils/path");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4") {
      cb(null, true);
    } else {
      cb({ message: "Unsupported File Format" }, false);
    }
  },
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
