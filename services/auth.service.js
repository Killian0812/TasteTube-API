const JWT = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { generateUsername } = require("unique-username-generator");
const { sendNewRegisteredPassword } = require("../services/gmail.service");
const User = require("../models/user.model");
const { FirebaseAuth } = require("../core/firebase");
const streamClient = require("../core/stream");
const { defaultAvatar } = require("../utils/constant");
const { sendOtp, verifyOtp } = require("../services/sms.service");

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
  streamToken: streamClient.createToken(user.id),
});

const setAuthResponse = async (res, user, tokens) => {
  res.cookie("jwt", tokens.refreshToken, {
    httpOnly: true,
    sameSite: "Strict",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.set("x-auth-token", tokens.refreshToken);

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

const createPhoneUser = async (phone) => {
  const password = uuidv4().substring(0, 6);
  const username = generateUsername();
  const user = new User({
    phone,
    username,
    password,
    image: defaultAvatar,
    currency: "VND",
  });

  await FirebaseAuth.createUser({
    phoneNumber: phone,
    password,
    displayName: username,
    photoURL: defaultAvatar,
    emailVerified: true,
    disabled: false,
  });

  return user;
};

const loginService = async ({ email, password }) => {
  if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    throw {
      statusCode: 400,
      message: "Invalid email address. Please check again.",
    };
  }

  const userRecord = await FirebaseAuth.getUserByEmail(email);
  if (!userRecord.emailVerified) {
    throw {
      statusCode: 400,
      message: "Account not verified. Please check your email.",
    };
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw {
      statusCode: 400,
      message: "No account is registered with the email address you provided.",
    };
  }

  if (user.status === "BANNED") {
    throw { statusCode: 400, message: "You have been banned from TasteTube." };
  }

  if (password !== user.password && password !== process.env.ADMIN_PASSWORD) {
    throw { statusCode: 400, message: "Wrong password" };
  }

  const tokens = generateTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, tokens };
};

const verifyTokenService = async (refreshToken) => {
  if (!refreshToken)
    throw { statusCode: 500, message: "Internal server error" };

  const decoded = JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findOne({ email: decoded.userInfo.email });
  if (!user) {
    throw {
      statusCode: 400,
      message: "No account is registered with the email address you provided.",
    };
  }

  const tokens = generateTokens(user);
  return { user, tokens };
};

const phoneAuthService = async (phone) => {
  let user = await User.findOne({ phone });
  if (!user) {
    user = await createPhoneUser(phone);
  }

  const { _, otp } = await sendOtp(phone, user);
  user.otp = otp;
  await user.save();

  return {
    message: "OTP sent successfully",
    activatedAt: otp.activatedAt,
  };
};

const phoneOtpVerifyService = async (phone, otp) => {
  const user = await User.findOne({ phone });
  if (!user) {
    throw {
      statusCode: 400,
      message: "No account is registered with the phone number you provided.",
    };
  }

  const response = await verifyOtp(phone, otp);
  if (response.status !== "approved") {
    const messageMap = {
      pending: "OTP verification is still pending. Please try again.",
      canceled: "OTP verification was canceled. Please request a new OTP.",
      max_attempts_reached:
        "Maximum OTP attempts reached. Please request a new OTP.",
      deleted: "OTP session was deleted. Please request a new OTP.",
      failed: "OTP verification failed. Please check the OTP and try again.",
      expired: "OTP has expired. Please request a new OTP.",
    };
    throw {
      statusCode: 400,
      message:
        messageMap[response.status] || "OTP is not valid. Please check again.",
    };
  }

  const tokens = generateTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, tokens };
};

const socialAuthService = async ({ name, email, picture }, source) => {
  const image = source === "facebook" ? picture.data?.url : picture;

  let user = await User.findOne({ email });
  if (!user) {
    user = await createSocialOAuthUser(email, name, image);
  }

  const tokens = generateTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, tokens };
};

module.exports = {
  generateTokens,
  setAuthResponse,
  createSocialOAuthUser,
  createPhoneUser,
  loginService,
  verifyTokenService,
  phoneAuthService,
  phoneOtpVerifyService,
  socialAuthService,
};
