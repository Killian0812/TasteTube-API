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
    const newUser = new User({
        email, password, username,
        image: `https://shorturl.at/ajFg5`
    });
    newUser.save()
        .then(() => {
            console.log("Registered");
            return res.status(200).json({
                "userId": newUser.id,
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(400).json({ "message": err })
        });
}

const handleSetAccountType = async (req, res) => {
    const { userId, role } = req.body;

    console.log(req.body);

    if (role !== "RESTAURANT" && role !== "CUSTOMER" || !userId)
        return res.status(400).json({
            "message": "Not a valid account role"
        });

    let existingUser = await User.findById(userId);

    if (!existingUser)
        return res.status(400).json({
            "message": "Something went wrong"
        });

    if (existingUser.role)
        return res.status(400).json({
            "message": "Can not change role when created"
        });

    existingUser.role = role;
    try {
        await existingUser.save();

        return res.status(200).json({
            "message": "Account role updated successfully",
            "role": existingUser.role
        });
    } catch (error) {
        console.error("Error updating account type:", error);
        return res.status(500).json({
            "message": "Internal server error. Please try again later."
        });
    }
}

module.exports = { handleRegister, handleSetAccountType };