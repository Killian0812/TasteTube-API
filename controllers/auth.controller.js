const {
  loginService,
  verifyTokenService,
  phoneAuthService,
  phoneOtpVerifyService,
  socialAuthService,
  setAuthResponse,
  handleLogout,
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

const logout = async (req, res) => {
  try {
    const result = await handleLogout(req.cookies?.jwt);

    // Clear the cookie on the client regardless
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "Strict",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(result.status).send(result.message);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  login,
  verifyToken,
  phoneAuth,
  phoneOtpVerify,
  googleAuth,
  facebookAuth,
  logout,
};
