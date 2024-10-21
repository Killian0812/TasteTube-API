const verifyOwner = (req, res, next) => {
    if (!req?.userId)
        return res.status(401).json({
            "message": "Unauthorized"
        });
    const allowed = req.params.userId === req.userId;
    if (!allowed) {
        return res.status(403).json({
            "message": "Permission denied"
        });
    }
    console.log("Owner verified");
    next();
}

module.exports = verifyOwner;