const axios = require("axios");
const express = require("express");

const registerRouter = require("../routes/register.router");
const authRouter = require("../routes/auth.router");
const logoutRouter = require("../routes/logout.router");
const refreshTokenRouter = require("../routes/refreshToken.router");
const userRouter = require("../routes/user.router");
const productRouter = require("../routes/product.router");
const videoRouter = require("../routes/video.router");
const contentRouter = require("../routes/content.router");
const shopRouter = require("../routes/shop.router");
const cartRouter = require("../routes/cart.router");
const orderRouter = require("../routes/order.router");
const addressRouter = require("../routes/address.router");
const paymentRouter = require("../routes/payment.router");
const paymentOptionRouter = require("../routes/paymentOption.router");
const deliveryRouter = require("../routes/delivery.router");
const orderDeliveryRouter = require("../routes/orderDelivery.router");
const fcmRouter = require("../routes/fcm.router");
const discountRouter = require("../routes/discount.router");
const feedbackRouter = require("../routes/feedback.router");
const chatRouter = require("../routes/chat.router");
const analyticRouter = require("../routes/analytic.router");
const verifyJWT = require("../middlewares/verifyJWT");

const setupRoutes = (app) => {
  // Google Maps API proxy
  app.use("/api/maps", _configureGoogleMapsProxy());

  // Public routes
  app.use("/api/register", registerRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/refresh", refreshTokenRouter);
  app.use("/api/logout", logoutRouter);
  app.use("/api/users", userRouter);
  app.use("/api/product", productRouter);
  app.use("/api/videos", videoRouter);
  app.use("/api/payment", paymentRouter);
  app.use("/api/chat", chatRouter);

  // Protected routes
  app.use("/api/content", verifyJWT(), contentRouter);
  app.use("/api/shop", verifyJWT(true), shopRouter);
  app.use("/api/cart", verifyJWT(), cartRouter);
  app.use("/api/order", verifyJWT(), orderRouter);
  app.use("/api/address", verifyJWT(), addressRouter);
  app.use("/api/payment-option", verifyJWT(), paymentOptionRouter);
  app.use("/api/delivery", verifyJWT(), deliveryRouter);
  app.use("/api/order-delivery", verifyJWT(), orderDeliveryRouter);
  app.use("/api/fcm", verifyJWT(), fcmRouter);
  app.use("/api/discount", verifyJWT(), discountRouter);
  app.use("/api/feedback", verifyJWT(), feedbackRouter);
  app.use("/api/analytic", verifyJWT(), analyticRouter);
};

const _configureGoogleMapsProxy = () => {
  const router = express.Router();

  router.all("/*", async (req, res) => {
    try {
      const apiPath = req.path.slice(1); // Remove leading slash
      const fullUrl = `https://maps.googleapis.com/maps/api/${apiPath}`;

      const apiKey = process.env.GOOGLE_MAPS_APIKEY || req.query.key;
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      const { key, ...queryParams } = req.query;
      const config = {
        params: { ...queryParams, key: apiKey },
        data: req.body,
      };

      let response;
      switch (req.method) {
        case "GET":
          response = await axios.get(fullUrl, { params: config.params });
          break;
        case "POST":
          response = await axios.post(fullUrl, config.data, {
            params: config.params,
          });
          break;
        default:
          return res.status(405).json({ message: "Method Not Allowed" });
      }

      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error("Google Maps proxy error:", error.message);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: error.message,
        });
      }
    }
  });

  return router;
};

module.exports = setupRoutes;
