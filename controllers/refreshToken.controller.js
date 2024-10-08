const JWT = require('jsonwebtoken');
var User = require('../models/user.model');

const handleRefreshToken = async (req, res) => {

    console.log('Someone refreshing');

    const cookies = req.cookies;
    if (!cookies?.jwt) {
        return res.status(401).send("No JWT cookies");
    }

    const refreshToken = cookies.jwt;

    // console.log(refreshToken);

    const existingUser = await User.findOne({ refreshToken: refreshToken });
    if (!existingUser) {
        return res.status(403).send("Invalid refresh token");
    }

    // evaluate jwt 
    JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err || existingUser.username !== decoded.userInfo.username)
                return res.status(403).send("Error verifying jwt\nToken maybe expired");

            const userId = existingUser._id;
            const username = existingUser.username;
            const email = existingUser.email;
            const image = existingUser.image || `https://shorturl.at/ajFg5`;

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

module.exports = { handleRefreshToken }