const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    phone: String,
    email: String,
    username: String,
    password: String,
    filename: String,
    image: String,
    refreshToken: String,
})

module.exports = mongoose.model('User', userSchema)