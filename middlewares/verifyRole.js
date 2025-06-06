const logger = require("../core/logger");

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    logger.info("verifying role");
    logger.info(req.roles);
    if (!req?.roles) return res.sendStatus(403);
    const allowedRolesArr = [...allowedRoles];
    const allowed = req.roles.some((role) => allowedRolesArr.includes(role));
    if (!allowed) {
      logger.info("Role not allowed");
      return res.sendStatus(403);
    }
    logger.info("Role allowed");
    next();
  };
};

module.exports = verifyRole;
