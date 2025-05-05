const router = require("express").Router();
const chatController = require("../controllers/chat.controller");

router.post("/new-event", chatController.autoAIResponse);
router.get("/channel/:channelId", chatController.getChannelSettings);
router.post("/channel/:channelId", chatController.updateChannelSettings);

module.exports = router;
