const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    phone: String,
    email: String,
    username: String,
    password: String,
    filename: String, // filename in storage
    image: String, // avatar
    refreshToken: String,
    role: String, // "customer" | "restaurant"
})

module.exports = mongoose.model('User', userSchema)