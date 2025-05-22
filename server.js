const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { staticFolderPath, rootDir } = require("./utils/path");
const { app, server } = require("./socket");
const version = require("./package.json").version;
const logger = require("./logger");

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use(cookieParser());
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin (e.g., Postman)

    const allowedPatterns = [
      /^https:\/\/taste-tube.*\.web\.app$/,
      /^https:\/\/taste-tube.*\.firebaseapp\.com$/,
      /^https:\/\/admin-taste-tube.*\.web\.app$/,
      /^https:\/\/admin-taste-tube.*\.firebaseapp\.app$/,
      /^http:\/\/localhost:5555$/,
    ];

    const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  exposedHeaders: ["x-auth-token"],
};
app.use(cors(corsOptions));

// mongodb atlas connect
const uri = process.env.MONGODB_URI;
const databaseConnect = () => {
  mongoose
    .connect(uri, { dbName: "tastetube", autoIndex: true })
    .then(() => {
      logger.info("MongoDB Cloud connection established successfully");
    })
    .catch((err) => {
      logger.error("MongoDB connection error:", err);
      setTimeout(databaseConnect, 3000); // Retry connection after 3 seconds
    });
};

databaseConnect();

// routing
const registerRouter = require("./routes/register.router");
const authRouter = require("./routes/auth.router");
const logoutRouter = require("./routes/logout.router");
const refreshTokenRouter = require("./routes/refreshToken.router");
const userRouter = require("./routes/user.router");
const productRouter = require("./routes/product.router");
const videoRouter = require("./routes/video.router");
const contentRouter = require("./routes/content.router");
const shopRouter = require("./routes/shop.router");
const cartRouter = require("./routes/cart.router");
const orderRouter = require("./routes/order.router");
const addressRouter = require("./routes/address.router");
const paymentRouter = require("./routes/payment.router");
const paymentOptionRouter = require("./routes/paymentOption.router");
const deliveryRouter = require("./routes/delivery.router");
const orderDeliveryRouter = require("./routes/orderDelivery.router");
const fcmRouter = require("./routes/fcm.router");
const discountRouter = require("./routes/discount.router");
const feedbackRouter = require("./routes/feedback.router");
const chatRouter = require("./routes/chat.router");
const analyticRouter = require("./routes/analytic.router");

const verifyJWT = require("./middlewares/verifyJWT");

// Swagger API Docs
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// serve static files
app.use(express.static(staticFolderPath));

app.get("/payment/success", function (_, res) {
  res.sendFile(`${staticFolderPath}/payment_success.html`, function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});
app.get("/payment/failed", function (_, res) {
  res.sendFile(`${staticFolderPath}/payment_failed.html`, function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

app.get("/version", function (req, res) {
  res.json({ version });
});

app.get(/^\/(?!api).*/, function (_, res) {
  res.sendFile(`${staticFolderPath}/index.html`, function (err) {
    if (err) {
      return res.status(500).send(err);
    }
  });
});

// proxy Google Maps API requests
app.all("/api/maps/*", async (req, res) => {
  try {
    const apiPath = req.path.slice("/api/maps/".length);
    const fullUrl = `https://maps.googleapis.com/maps/api/${apiPath}`;

    const apiKey = process.env.GOOGLE_MAPS_APIKEY || req.query.key;
    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    const { key, ...queryParams } = req.query;

    const config = {
      url: fullUrl,
      params: {
        ...queryParams,
        key: apiKey,
      },
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
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
});

app.use("/api/register", registerRouter);
app.use("/api/auth", authRouter);
app.use("/api/refresh", refreshTokenRouter);
app.use("/api/logout", logoutRouter);
app.use("/api/users", userRouter);
app.use("/api/product", productRouter);
app.use("/api/videos", videoRouter);
app.use("/api/content", verifyJWT(), contentRouter);
app.use("/api/shop", verifyJWT(), shopRouter);
app.use("/api/cart", verifyJWT(), cartRouter);
app.use("/api/order", verifyJWT(), orderRouter);
app.use("/api/address", verifyJWT(), addressRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/payment-option", verifyJWT(), paymentOptionRouter);
app.use("/api/delivery", verifyJWT(), deliveryRouter);
app.use("/api/order-delivery", verifyJWT(), orderDeliveryRouter);
app.use("/api/fcm", verifyJWT(), fcmRouter);
app.use("/api/discount", verifyJWT(), discountRouter);
app.use("/api/feedback", verifyJWT(), feedbackRouter);
app.use("/api/chat", chatRouter);
app.use("/api/analytic", verifyJWT(), analyticRouter);

const port = process.env.PORT;
const ip = process.env.IP;

server.listen(port, ip, () => {
  logger.info(`Server is running at http://${ip}:${port}`);
});

const cronjobs = require("./cronjob");
cronjobs.forEach((job) => job.start());
