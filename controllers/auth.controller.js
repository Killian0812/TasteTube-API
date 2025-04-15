const JWT = require("jsonwebtoken");
const User = require("../models/user.model");
const { FirebaseAuth } = require("../firebase");
const logger = require("../logger");
const { EMAIL_REGEX } = require("../utils/regex");
const {
  setAuthResponse,
  generateTokens,
  createSocialOAuthUser,
} = require("../services/auth.service");

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
    if (!user)
      return res.status(400).json({
        message:
          "No account is registered with the email address you provided.",
      });

    if (password !== user.password)
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
      process.env.ACCESS_TOKEN_SECRET,
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
  googleAuth: (req, res) => socialAuth(req, res, "google"),
  facebookAuth: (req, res) => socialAuth(req, res, "facebook"),
};
