const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

io.on("connection", (socket) => {
    const _id = socket.handshake.query._id;

    if (_id) {
        console.log(`Created socket connection for ${_id}: ${socket.id}`);
        userSocketMap[_id] = socket.id;

        socket.on("calling", (data) => {
        });

        socket.on("disconnect", () => {
        });
    }
});

module.exports = { app, io, server };