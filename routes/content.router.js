const router = require("express").Router();
const contentController = require("../controllers/content.controller");

router.post("/search", contentController.search);
router.get("/feeds", contentController.getFeeds);
// router.get('/reviews', ); // get recommended reviews
// router.get('/reviews/:userId', ); // get certain reviews

module.exports = router;
