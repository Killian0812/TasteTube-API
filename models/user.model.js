const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
    },
    username: String,
    password: {
        type: String,
        required: true,
    },
    filename: String, // filename in storage  
    image: String, // avatar url
    refreshToken: String,
    role: {
        type: String,
        enum: ['CUSTOMER', 'RESTAURANT'],
    },
    bio: String,
});

module.exports = mongoose.model('User', userSchema);