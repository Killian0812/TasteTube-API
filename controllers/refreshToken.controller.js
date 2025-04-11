const JWT = require("jsonwebtoken");
const User = require("../models/user.model");
const { setAuthResponse, generateTokens } = require("../services/auth.service");

const refreshToken = async (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No JWT" });
  }

  // evaluate jwt
  JWT.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).send({ message: "Token expired" });

      const existingUser = await User.findById(decoded.userInfo.userId);

      const tokens = generateTokens(existingUser);

      setTimeout(async () => {
        existingUser.refreshToken = tokens.refreshToken;
        await existingUser.save();
      }, 0);

      console.log(`Token refresh successfully: ${existingUser.email}`);
      return setAuthResponse(res, existingUser, tokens);
    }
  );
};

module.exports = { refreshToken };
