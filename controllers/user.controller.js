const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { FirebaseStorage } = require('../firebase');
const bucket = FirebaseStorage.bucket();
var User = require('../models/user.model');

const getUserInfo = async (req, res) => {
    const userId = req.params.userId;
    if (!userId)
        return res.status(400).json({ message: "No user found" });
    User.findById(userId)
        .then(user => res.status(200).json(user))
        .catch(e => res.status(500).json({ message: e }))
}

const updateUserInfo = async (req, res) => {

}

module.exports = { getUserInfo, updateUserInfo }