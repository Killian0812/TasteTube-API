const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const { app, server } = require("./socket");

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(cookieParser());
const corsOptions = {
  exposedHeaders: ["x-auth-token"], // exposed since set-cookie can't be used through ngrok
};
app.use(cors(corsOptions));

// mongodb atlas connect
const uri = process.env.MONGODB_CLUSTER_URI;
mongoose.connect(uri, { dbName: "tastetube", autoIndex: true });
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB Cloud connection established successfully");
});

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

const verifyJWT = require("./middlewares/verifyJWT");

// serve static files
app.use(express.static(path.join(__dirname, "static")));

app.get("/payment/success", function (_, res) {
  res.sendFile(
    path.join(__dirname, "./static/payment_success.html"),
    function (err) {
      if (err) {
        res.status(500).send(err);
      }
    }
  );
});
app.get("/payment/failed", function (_, res) {
  res.sendFile(
    path.join(__dirname, "./static/payment_failed.html"),
    function (err) {
      if (err) {
        res.status(500).send(err);
      }
    }
  );
});

app.get(/^\/(?!api).*/, function (_, res) {
  res.sendFile(path.join(__dirname, "./static/index.html"), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
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

const port = process.env.PORT;
const ip = process.env.IP;

server.listen(port, ip, () => {
  console.log(`Server is running at ${ip}:${port}`);
});
