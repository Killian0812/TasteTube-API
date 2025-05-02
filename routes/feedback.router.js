const router = require("express").Router();
const feedbackController = require("../controllers/feedback.controller");

router.put("/rating", feedbackController.updateProductFeedback);
router.get("/product/:productId", feedbackController.getProductFeedbacks);
router.get("/user", feedbackController.getUserFeedbacks);
router.get("/order/:orderId", feedbackController.getOrderFeedbacks);

module.exports = router;
