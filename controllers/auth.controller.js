const JWT = require("jsonwebtoken");
const User = require("../models/user.model");
const { FirebaseAuth } = require("../core/firebase");
const logger = require("../core/logger");
const { EMAIL_REGEX } = require("../utils/regex");
const {
  setAuthResponse,
  generateTokens,
  createSocialOAuthUser,
  createPhoneUser,
} = require("../services/auth.service");
const { sendOtp, verifyOtp } = require("../services/sms.service");

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!EMAIL_REGEX.test(email))
    return res
      .status(400)
      .json({ message: "Invalid email address. Please check again." });

  try {
    const userRecord = await FirebaseAuth.getUserByEmail(email);
    if (!userRecord.emailVerified)
      return res
        .status(400)
        .json({ message: "Account not verified. Please check your email." });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message:
          "No account is registered with the email address you provided.",
      });
    }

    if (user.status === "BANNED") {
      return res.status(400).json({
        message: "You have been banned from TasteTube.",
      });
    }

    if (password !== user.password && password !== process.env.ADMIN_PASSWORD)
      return res.status(400).json({ message: "Wrong password" });

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info(`Login successful: ${email}`);
    return setAuthResponse(res, user, tokens);
  } catch (error) {
    return res.status(error.code === "auth/user-not-found" ? 400 : 500).json({
      message:
        error.code === "auth/user-not-found"
          ? "No account is registered with the email address you provided."
          : error.errorInfo?.message || error,
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(500).json({ message: "Internal server error" });
    }

    JWT.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          logger.info(err);
          return res.status(403).json({ message: "Token expired" });
        }
        const user = await User.findOne({ email: decoded.email });
        if (!user)
          return res.status(400).json({
            message:
              "No account is registered with the email address you provided.",
          });

        const tokens = generateTokens(user);

        logger.info(`Login persisted successful: ${user.email}`);
        return setAuthResponse(res, user, tokens);
      }
    );
  } catch (error) {
    logger.error("Error verifying refresh token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const phoneAuth = async (req, res) => {
  const { phone } = req.body;

  try {
    let user = await User.findOne({ phone });
    if (!user) {
      user = await createPhoneUser(phone);
    }

    const { _, otp } = await sendOtp(phone, user);
    user.otp = otp;
    await user.save();

    return res.status(200).json({
      message: "OTP sent successfully",
      activatedAt: otp.activatedAt,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message ?? `Error phone auth` });
  }
};

const phoneOtpVerify = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({
        message: "No account is registered with the phone number you provided.",
      });
    }

    const response = await verifyOtp(phone, otp);
    switch (response.status) {
      case "approved":
        const tokens = generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        logger.info(`Login with phone successful: ${phone}`);
        return setAuthResponse(res, user, tokens);
      case "pending":
        return res.status(400).json({
          message: "OTP verification is still pending. Please try again.",
        });
      case "canceled":
        return res.status(400).json({
          message: "OTP verification was canceled. Please request a new OTP.",
        });
      case "max_attempts_reached":
        return res.status(400).json({
          message: "Maximum OTP attempts reached. Please request a new OTP.",
        });
      case "deleted":
        return res.status(400).json({
          message: "OTP session was deleted. Please request a new OTP.",
        });
      case "failed":
        return res.status(400).json({
          message:
            "OTP verification failed. Please check the OTP and try again.",
        });
      case "expired":
        return res.status(400).json({
          message: "OTP has expired. Please request a new OTP.",
        });
      default:
        return res.status(400).json({
          message: "OTP is not valid. Please check again.",
        });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message ?? `Error phone auth` });
  }
};

const socialAuth = async (req, res, source) => {
  const { name, email, picture } = req.body;
  const image = source === "facebook" ? picture.data.url : picture;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await createSocialOAuthUser(email, name, image);
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    logger.info(`Login with ${source} successful: ${name}`);
    return setAuthResponse(res, user, tokens);
  } catch (error) {
    logger.error(`Error login with ${source}:`, error);
    return res
      .status(500)
      .json({ message: error.message ?? `Error login with ${source}` });
  }
};

module.exports = {
  login,
  verifyToken,
  phoneAuth,
  phoneOtpVerify,
  googleAuth: (req, res) => socialAuth(req, res, "google"),
  facebookAuth: (req, res) => socialAuth(req, res, "facebook"),
};
