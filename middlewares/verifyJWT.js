const jwt = require("jsonwebtoken");

const verifyJWT = (publicView = false) => {
  return (req, res, next) => {
    console.log("verifying JWTs");
    // extracing token from header
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"]; // 'Authorization': Bearer token
    const tokenInAuthHeader = authHeader?.split(" ")[1];

    const tokenInBearerHeader = req.headers["bearer"]; // 'Bearer': token

    if (!tokenInAuthHeader && !tokenInBearerHeader) {
      console.log("No JWT");
      if (!publicView) return res.status(401).send("No authorization header");
    }
    jwt.verify(
      tokenInAuthHeader || tokenInBearerHeader,
      process.env.ACCESS_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          console.log(err);
          if (!publicView) return res.status(403).send("Error verifying JWTs");
        }
        req.username = decoded.userInfo.username;
        req.userId = decoded.userInfo.userId;
        console.log("JWT Verified");
        next();
      }
    );
  };
};

module.exports = verifyJWT;
