const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const { app, server } = require('./socket');

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// mongodb atlas connect
const uri = process.env.MONGODB_CLUSTER_URI;
mongoose.connect(uri, { dbName: 'tastetube' });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB Cloud connection established successfully");
})

// routing
const registerRouter = require('./routes/register.router');
const authRouter = require('./routes/auth.router');
const logoutRouter = require('./routes/logout.router');
const refreshTokenRouter = require('./routes/refreshToken.router');
const userRouter = require('./routes/user.router');

const verifyJWT = require('./middlewares/verifyJWT');

// serve static files
app.use(express.static(path.join(__dirname, 'static')));
app.get(/^\/(?!api).*/, function (_, res) {
    res.sendFile(
        path.join(__dirname, "./static/index.html"),
        function (err) {
            if (err) {
                res.status(500).send(err);
            }
        }
    );
})

app.use('/api/register', registerRouter);
app.use('/api/auth', authRouter);
app.use('/api/refresh', refreshTokenRouter);
app.use('/api/logout', logoutRouter);
app.use('/api/user', verifyJWT, userRouter);

const port = process.env.PORT;
const ip = process.env.IP;

server.listen(port, ip, () => {
    console.log(`Server is running at ${ip}:${port}`);
})

