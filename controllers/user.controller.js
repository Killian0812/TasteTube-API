const { uploadToFirebaseStorage, deleteFromFirebaseStorage } = require('../services/storage.service');
const User = require('../models/user.model');

const getUserInfo = async (req, res) => {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({ message: "No user found" });
    }

    try {
        const user = await User.findById(userId)
            .populate('videos').populate('likedVideos');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { followers, followings, username, email, phone, bio,
            filename, image, videos, likedVideos } = user;
        return res.status(200).json({
            username, email, phone, filename, image, videos, likedVideos, bio,
            followers: followers.length, // only return counts
            followings: followings.length,
        });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

const updateUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('videos').populate('likedVideos');
        if (!user) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        let { username, email, phone, bio } = req.body;

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

        if (bio && bio.trim() !== user.bio) {
            user.bio = bio.trim();
        }

        const newImage = req.file;
        const oldFilename = user.filename;
        if (newImage) {
            const { url, filename } = await uploadToFirebaseStorage(newImage);
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

        const { followers, followings, videos, likedVideos } = user;
        return res.status(200).json({
            username: user.username, email: user.email, phone: user.phone, bio: user.bio,
            filename: user.filename, image: user.image, videos, likedVideos,
            followers: followers.length, // only return counts
            followings: followings.length,
        });

    } catch (error) {
        console.error("Error handling profile update:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

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

module.exports = { getUserInfo, updateUserInfo, changePassword }