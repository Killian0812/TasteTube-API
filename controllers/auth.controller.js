const {
  loginService,
  verifyTokenService,
  phoneAuthService,
  phoneOtpVerifyService,
  socialAuthService,
  setAuthResponse,
} = require("../services/auth.service");

const login = async (req, res) => {
  try {
    const { user, tokens } = await loginService(req.body);
    return setAuthResponse(res, user, tokens);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const verifyToken = async (req, res) => {
  try {
    const { user, tokens } = await verifyTokenService(req.body.refreshToken);
    return setAuthResponse(res, user, tokens);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const phoneAuth = async (req, res) => {
  try {
    const result = await phoneAuthService(req.body.phone);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const phoneOtpVerify = async (req, res) => {
  try {
    const { user, tokens } = await phoneOtpVerifyService(
      req.body.phone,
      req.body.otp
    );
    return setAuthResponse(res, user, tokens);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { user, tokens } = await socialAuthService(req.body, "google");
    return setAuthResponse(res, user, tokens);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const facebookAuth = async (req, res) => {
  try {
    const { user, tokens } = await socialAuthService(req.body, "facebook");
    return setAuthResponse(res, user, tokens);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  login,
  verifyToken,
  phoneAuth,
  phoneOtpVerify,
  googleAuth,
  facebookAuth,
};
