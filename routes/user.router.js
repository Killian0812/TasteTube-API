const router = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const verifyJWT = require("../middlewares/verifyJWT");
const userController = require("../controllers/user.controller");

router.get("/:userId", verifyJWT(true), userController.getUserInfo);
router.post(
  "/:userId",
  verifyJWT(),
  upload.single("image"),
  userController.updateUserInfo
);
router.put(
  "/:userId/change_password",
  verifyJWT(),
  userController.changePassword
);
router.put("/:userId/follow", verifyJWT(), userController.followUser);
router.put("/:userId/unfollow", verifyJWT(), userController.unfollowUser);

module.exports = router;
