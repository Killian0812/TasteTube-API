var User = require('../models/user.model');
const { uploadToFirebaseStorage, deleteFromFirebaseStorage } = require('../services/storage.service');

const editInfo = async (req, res) => {
    try {
        console.log(`${req.username} updating profile`);

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        const image = req.file;
        let { username, email, phone } = req.body;

        if (username && username.trim() !== user.username) {
            user.username = username.trim();
        }

        if (phone && phone.trim() !== user.phone) {
            const existingUserWithPhone = await User.findOne({ phone: phone.trim() });
            if (existingUserWithPhone && existingUserWithPhone.username !== req.username) {
                return res.status(400).json({ message: "Phone number taken. Please check again" });
            }
            user.phone = phone.trim();
        }

        if (email && email.trim() !== user.email) {
            const existingUserWithEmail = await User.findOne({ email: email.trim() });
            if (existingUserWithEmail && existingUserWithEmail.username !== req.username) {
                return res.status(400).json({ message: "Email already taken. Please check again" });
            }
            user.email = email.trim();
        }

        const oldFilename = user.filename;
        if (image) {
            const { url, filename } = await uploadToFirebaseStorage(image);
            user.image = url;
            user.filename = filename;
        }

        await user.save();

        // only delete old avatar when user save succeeded
        if (oldFilename)
            try {
                await deleteFromFirebaseStorage(oldFilename);
            } catch (error) { // shouldn't affect user response
                console.error("Error deleting old avatar:", error);
            }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Error handling profile update:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const changePassword = async (req, res) => {
    console.log(`${req.username} changing password`);
    try {
        const user = await User.findById(req.userId);
        if (user) {
            const { oldPassword, newPassword, matchPassword } = req.body;
            if (newPassword !== matchPassword) {
                // console.log(newPassword, matchPassword);
                return res.status(401).json({ "message": 'Confirm password does not match' })
            }

            if (oldPassword == user.password) {
                user.password = newPassword;
                await user.save();
                return res.status(200).json({ "message": 'Password saved' });
            }
            else
                return res.status(401).json({ "message": 'Current password does not correct' })
        }
        else {
            return res.status(500).json({ "message": 'Internal Server Error' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": 'Internal Server Error' });
    }
}

const getProfile = async (req, res) => {
    console.log(`${req.username} getting info`);
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(500).json({ "message": 'Unexpected error' })
        }
        return res.status(200).json({
            username: user.username,
            email: user.email,
            phone: user.phone,
            image: user.image,
            bio: user.bio,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": 'Internal Server Error' });
    }
}

module.exports = { changePassword, editInfo, getProfile }