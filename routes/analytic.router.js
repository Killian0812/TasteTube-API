const router = require("express").Router();
const analyticController = require("../controllers/analytic.controller");

router.get("/shop/:shopId", analyticController.getShopAnalytics);

module.exports = router;
