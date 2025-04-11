const router = require("express").Router();
const fcmController = require("../controllers/fcm.controller");

router.post("/update-token", fcmController.updateFcmToken);

module.exports = router;
