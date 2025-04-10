const JWT = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendNewRegisteredPassword } = require("../services/gmail.service");
const User = require("../models/user.model");
const { FirebaseAuth } = require("../firebase");
const { defaultAvatar } = require("../utils/constant");
const StreamServer = require("../stream");

const generateTokens = (user) => ({
  accessToken: JWT.sign(
    {
      userInfo: {
        username: user.username,
        userId: user.id,
        email: user.email,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "8h" }
  ),
  refreshToken: JWT.sign(
    {
      userInfo: {
        username: user.username,
        userId: user.id,
        email: user.email,
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  ),
  streamToken: StreamServer.createToken(user.id),
});

const setAuthResponse = async (res, user, tokens) => {
  res.cookie("jwt", tokens.refreshToken, {
    httpOnly: true,
    sameSite: "Strict",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.set("x-auth-token", tokens.refreshToken);

  // update or create Stream user
  const _streamUser = await StreamServer.upsertUser({
    id: user.id,
    name: user.username,
    image: user.image,
  });

  return res.status(200).json({
    userId: user._id,
    email: user.email,
    role: user.role ?? "",
    username: user.username,
    image: user.image || defaultAvatar,
    currency: user.currency,
    ...tokens,
  });
};

const createSocialOAuthUser = async (email, name, picture) => {
  const password = uuidv4().substring(0, 6);
  const user = new User({
    username: name,
    email,
    password,
    image: picture || defaultAvatar,
    currency: "VND",
  });

  await FirebaseAuth.createUser({
    email,
    password,
    displayName: name,
    photoURL: picture || defaultAvatar,
    emailVerified: true,
    disabled: false,
  });

  sendNewRegisteredPassword(email, name, password);
  return user;
};

module.exports = { generateTokens, setAuthResponse, createSocialOAuthUser };
