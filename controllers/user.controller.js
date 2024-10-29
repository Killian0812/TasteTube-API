const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { FirebaseStorage } = require('../firebase');
const bucket = FirebaseStorage.bucket();
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

}

module.exports = { getUserInfo, updateUserInfo }