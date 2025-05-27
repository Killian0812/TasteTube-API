const router = require("express").Router();
const contentController = require("../controllers/content.controller");

router.get("/search", contentController.search);
router.get("/feeds", contentController.getFeeds);
router.get("/following", contentController.getFollowingFeeds);

module.exports = router;
