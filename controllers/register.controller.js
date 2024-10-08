const JWT = require('jsonwebtoken');
const { generateUsername } = require("unique-username-generator");
var User = require('../models/user.model');

const handleRegister = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    let existingUser = await User.findOne({ email });
    if (existingUser) {
        console.log("Email duplicated");
        return res.sendStatus(409);
    }

    const username = generateUsername("", 3, 15);
    const refreshToken = JWT.sign(
        {
            "userInfo": {
                "email": email,
                "username": username,
            }
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    const newUser = new User({
        email, password, username, refreshToken,
        image: `https://shorturl.at/ajFg5`
    });
    newUser.save()
        .then(() => {
            console.log("Registered");
            const accessToken = JWT.sign(
                {
                    "userInfo": {
                        "userId": newUser._id,
                        "email": newUser.email,
                        "username": username,
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '8h' }
            );

            // sent refresh token as http cookie, last for 1d
            res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Strict', secure: true, maxAge: 24 * 60 * 60 * 1000 });

            return res.status(200).json({
                accessToken: accessToken,
                userId: newUser._id,
                email: newUser.email,
                username: newUser.username,
                image: newUser.image,
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(400).json(err)
        });
}
module.exports = { handleRegister };