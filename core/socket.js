const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { FirebaseRealtimeDatabase } = require("./firebase");
const logger = require("../logger");

const app = express();

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    logger.info(`Created socket connection for ${userId}: ${socket.id}`);
    userSocketMap[userId] = socket.id;

    socket.on("calling", (data) => {});

    socket.on("disconnect", () => logger.info(`${userId} disconnected`));
  } else {
    logger.info("Unknown connection");
  }
});

const notifyPayment = async (userId, status, pid) => {
  const socketId = userSocketMap[userId];

  if (!socketId) {
    await FirebaseRealtimeDatabase.ref(`users/${userId}/payments/${pid}`).set({
      pid,
      status: "success",
      createdAt: new Date().toISOString(),
    });
    logger.info(`(Firebase RTDB) Notified ${userId}; payment ${pid}`);
    return;
  }

  io.to(socketId).emit("payment", {
    status: status,
    pid: pid,
  });
  logger.info(`(Socket) Notified ${userId}; payment ${pid}`);
};

const kickoutUser = async (userId) => {
  await FirebaseRealtimeDatabase.ref(`users/${userId}/status`).set({
    status: "BANNED",
    createdAt: new Date().toISOString(),
  });
  logger.info(`(Firebase RTDB) Kicked ${userId}`);
};

module.exports = { app, io, server, notifyPayment, kickoutUser };
