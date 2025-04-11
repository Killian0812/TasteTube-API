const JWT = require("jsonwebtoken");
const User = require("../models/user.model");
const { setAuthResponse, generateTokens } = require("../services/auth.service");

const refreshToken = async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No JWT" });
  }

  const existingUser = await User.findOne({ refreshToken: refreshToken });
  if (!existingUser) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  // evaluate jwt
  JWT.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err || existingUser.username !== decoded.userInfo.username)
        return res.status(403).send({ message: "Token expired" });

      const tokens = generateTokens(existingUser);
      existingUser.refreshToken = tokens.refreshToken;
      await existingUser.save();

      console.log(`Token refresh successfully: ${existingUser.email}`);
      return setAuthResponse(res, existingUser, tokens);
    }
  );
};

module.exports = { refreshToken };
