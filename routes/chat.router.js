const router = require("express").Router();
const chatController = require("../controllers/chat.controller");

router.post("/new-event", chatController.autoAIResponse);

module.exports = router;
