const logger = require("../logger");
const jwt = require("jsonwebtoken");

const verifyJWT = (publicView = false) => {
  return (req, res, next) => {
    // extracing token from header
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"]; // 'Authorization': Bearer token
    const tokenInAuthHeader = authHeader?.split(" ")[1];
    const tokenInBearerHeader = req.headers["bearer"]; // 'Bearer': token

    const accessToken = tokenInAuthHeader || tokenInBearerHeader;

    if (!accessToken) {
      if (!publicView) {
        return res.status(401).send("No authorization header");
      }
    } else {
      jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
          if (err) {
            logger.info(err);
            if (!publicView)
              return res.status(403).send("Error verifying JWTs");
          }
          req.username = decoded.userInfo.username;
          req.userId = decoded.userInfo.userId;
        }
      );
    }
    next();
  };
};

module.exports = verifyJWT;
