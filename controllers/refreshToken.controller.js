const JWT = require('jsonwebtoken');
var User = require('../models/user.model');

const refreshToken = async (req, res) => {

    console.log('Someone refreshing');

    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ "message": "No JWT" });
    }

    const existingUser = await User.findOne({ refreshToken: refreshToken });
    if (!existingUser) {
        return res.status(403).json({ "message": "Invalid refresh token" });
    }

    // evaluate jwt 
    JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err || existingUser.username !== decoded.userInfo.username)
                return res.status(403).send({ "message": "Token expired" });

            const userId = existingUser._id;
            const username = existingUser.username;
            const email = existingUser.email;
            const image = existingUser.image;

            const newAccessToken = JWT.sign(
                {
                    "userInfo": {
                        "username": username,
                        "userId": userId,
                        "email": email,
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '8h' }
            );

            return res.status(200).json({
                username, userId, email, accessToken: newAccessToken, image
            });
        }
    );
}

module.exports = { refreshToken }