const JWT = require('jsonwebtoken');
const { generateFromEmail } = require("unique-username-generator");
var User = require('../models/user.model');
const { sendVerificationLink } = require('../services/gmail.service');
const { defaultAvatar } = require('../utils/constant');
const { FirebaseAuth } = require('../firebase');

const register = async (req, res) => {
    const { email, password } = req.body;

    await FirebaseAuth.createUser({
        email: email,
        password: password,
        displayName: generateFromEmail(email, 3),
        photoURL: defaultAvatar,
        emailVerified: false,
        disabled: false,
    }).then(async (userRecord) => {
        const newUser = new User({
            email, password,
            username: userRecord.displayName,
            uid: userRecord.uid,
            image: defaultAvatar
        });
        await newUser.save();
        sendVerificationLink(email);
        return res.status(200).json({
            "userId": newUser.id,
        });
    }).catch((error) => {
        return res.status(400).json({ "message": error.message ?? error });
    });
}

const setAccountType = async (req, res) => {
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

module.exports = { register, setAccountType };