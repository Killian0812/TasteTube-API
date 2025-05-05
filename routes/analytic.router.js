const router = require("express").Router();
const analyticController = require("../controllers/analytic.controller");

router.get("/shop/:shopId", analyticController.getShopAnalytics);
router.get("/system", analyticController.getSystemMetrics);

module.exports = router;
