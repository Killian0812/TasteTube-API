const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    console.log(`Created socket connection for ${userId}: ${socket.id}`);
    userSocketMap[userId] = socket.id;

    socket.on("calling", (data) => {});

    socket.on("disconnect", () => console.log(`${userId} disconnected`));
  } else {
    console.log("Unknown connection");
  }
});

const notifyPayment = (userId, status, pid) => {
  const socketId = userSocketMap[userId];

  if (!socketId) return;

  io.to(socketId).emit("payment", {
    status: status,
    pid: pid,
  });
};

module.exports = { app, io, server, notifyPayment };
