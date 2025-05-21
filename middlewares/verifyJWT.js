const logger = require("../logger");
const jwt = require("jsonwebtoken");

const verifyJWT = (publicView = false) => {
  return (req, res, next) => {
    // Extract token from header
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    const tokenInAuthHeader = authHeader?.split(" ")[1];
    const tokenInBearerHeader = req.headers["bearer"];
    const accessToken = tokenInAuthHeader || tokenInBearerHeader;

    // If no token and not a public view, return 401
    if (!accessToken) {
      if (!publicView) {
        return res
          .status(401)
          .json({ error: "No authorization token provided" });
      }
      return next(); // Continue for public views
    }

    // Verify JWT
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        logger.error(err);
        if (!publicView) {
          // Handle specific JWT errors
          if (err.name === "TokenExpiredError") {
            return res
              .status(401)
              .json({ error: "Token expired", expiredAt: err.expiredAt });
          }
          return res.status(403).json({ error: "Invalid or malformed token" });
        }
        return next(); // Continue for public views even if token is invalid
      }

      // Attach user info to request
      req.username = decoded.userInfo?.username;
      req.userId = decoded.userInfo?.userId;

      // Validate that required user info is present
      if (!publicView && (!req.username || !req.userId)) {
        logger.error("Missing user info in decoded JWT");
        return res.status(403).json({ error: "Invalid token payload" });
      }

      next();
    });
  };
};

module.exports = verifyJWT;
