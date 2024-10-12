const JWT = require('jsonwebtoken');
const { generateFromEmail } = require("unique-username-generator");
var User = require('../models/user.model');
const { EMAIL_REGEX } = require('../utils/regex');

const handleRegister = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!EMAIL_REGEX.test(email))
        return res.status(400).json({ "message": "Not a valid email address" });

    let existingUser = await User.findOne({ email });
    if (existingUser) {
        console.log("Email duplicated");
        return res.status(409).json({ "message": "Email duplicated" });
    }

    const username = generateFromEmail(email, 3);
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
            return res.status(400).json({ "message": err })
        });
}
module.exports = { handleRegister };