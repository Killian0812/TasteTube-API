const JWT = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendNewRegisteredPassword } = require("../services/gmail.service");
const User = require("../models/user.model");
const { FirebaseAuth } = require("../firebase");
const { defaultAvatar } = require("../utils/constant");
const { EMAIL_REGEX } = require("../utils/regex");

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!EMAIL_REGEX.test(email))
    return res
      .status(400)
      .json({ message: "Invalid email address. Please check again." });

  try {
    const userRecord = await FirebaseAuth.getUserByEmail(email);

    if (!userRecord) {
      return res
        .status(400)
        .json({ message: "No account registered with entered email." });
    }

    if (!userRecord.emailVerified) {
      return res
        .status(400)
        .json({ message: "Account not verified. Please check your email." });
    }

    const user = await User.findOne({ email: email });

    // TODO: Use secret encryption for password
    if (password != user.password)
      return res.status(400).json({ message: "Wrong password" });

    // create JWTs
    const accessToken = JWT.sign(
      {
        userInfo: {
          username: user.username,
          userId: user._id,
          email: user.email,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "8h" }
    );
    const refreshToken = JWT.sign(
      {
        userInfo: {
          username: user.username,
          userId: user._id,
          email: user.email,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    // send refresh token as http cookie, last for 1d
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.set("x-auth-token", refreshToken);

    console.log(`Login successful: ${email}`);

    return res.status(200).json({
      accessToken: accessToken,
      userId: user._id,
      email: user.email,
      role: user.role ?? "",
      username: user.username,
      image: user.image || defaultAvatar,
      currency: user.currency,
    });
  } catch (error) {
    if (error.code) {
      return res.status(400).json({ message: error.errorInfo.message });
    }
    return res.status(500).json({ message: error });
  }
};

const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(500).json({ message: "Internal server error" });
    }

    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(403).json({ message: "Token expired" });
      }

      const user = await User.findOne({ email: decoded.email });
      // console.log(user);
      return res.status(200).json({
        username: user.username,
        email: user.email,
        image: user.image,
      });
    });
  } catch (error) {
    console.error("Error verifying recover token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const googleAuth = async (req, res) => {
  const { name, email, picture } = req.body;

  console.log("Login with Google");

  try {
    // Check duplication
    let user = await User.findOne({ email });
    if (!user) {
      // If user doesn't exist, create a new user
      const password = uuidv4().substring(0, 6);

      // Create and save the new user
      user = new User({
        username: name,
        email,
        password,
        image: picture,
        currency: "VND",
      });

      await FirebaseAuth.createUser({
        email: email,
        password: password,
        displayName: name,
        photoURL: picture,
        emailVerified: true,
        disabled: false,
      });

      sendNewRegisteredPassword(email, name, password);
    }

    // create JWTs
    const accessToken = JWT.sign(
      {
        userInfo: {
          username: user.username,
          userId: user._id,
          email: user.email,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "8h" }
    );
    const refreshToken = JWT.sign(
      {
        userInfo: {
          username: user.username,
          userId: user._id,
          email: user.email,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token with current user
    user.refreshToken = refreshToken;
    await user.save();

    // send refresh token as http cookie, last for 1d
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.set("x-auth-token", refreshToken);

    console.log("Login with Google successful");

    res.status(200).json({
      accessToken: accessToken,
      userId: user._id,
      email: user.email,
      role: user.role ?? "",
      username: user.username,
      image: user.image || defaultAvatar,
      currency: user.currency,
    });
  } catch (error) {
    console.error("Error login with Google:", error);
    res
      .status(500)
      .json({ message: error.message ?? "Error login with Google" });
  }
};

const facebookAuth = async (req, res) => {
  const { name, email, picture } = req.body;

  console.log("Login with Facebook");

  try {
    // Check duplication
    let user = await User.findOne({ email });
    if (!user) {
      // If user doesn't exist, create a new user
      const password = uuidv4().substring(0, 6);

      // Create and save the new user
      user = new User({
        username: name,
        email,
        password,
        image: picture.data.url,
        currency: "VND",
      });

      await FirebaseAuth.createUser({
        email: email,
        password: password,
        displayName: name,
        photoURL: picture.data.url,
        emailVerified: true,
        disabled: false,
      });

      sendNewRegisteredPassword(email, name, password);
    }

    // create JWTs
    const accessToken = JWT.sign(
      {
        userInfo: {
          username: user.username,
          userId: user._id,
          email: user.email,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "8h" }
    );
    const refreshToken = JWT.sign(
      {
        userInfo: {
          username: user.username,
          userId: user._id,
          email: user.email,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token with current user
    user.refreshToken = refreshToken;
    await user.save();

    // send refresh token as http cookie, last for 1d
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.set("x-auth-token", refreshToken);

    console.log("Login with Facebook successful");

    res.status(200).json({
      accessToken: accessToken,
      userId: user._id,
      email: user.email,
      role: user.role ?? "",
      username: user.username,
      image: user.image || defaultAvatar,
      currency: user.currency,
    });
  } catch (error) {
    console.error("Error login with Facebook:", error);
    res
      .status(500)
      .json({ message: error.message ?? "Error login with Facebook" });
  }
};

module.exports = { login, verifyToken, googleAuth, facebookAuth };
