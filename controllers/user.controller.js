const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { FirebaseStorage } = require('../firebase');
const bucket = FirebaseStorage.bucket();
var User = require('../models/user.model');

const handleGetUserInfo = async (req, res) => {
    // path params
}

module.exports = { handleGetUserInfo }