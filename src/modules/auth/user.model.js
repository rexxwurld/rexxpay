const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);