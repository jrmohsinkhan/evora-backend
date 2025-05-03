const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return this.provider === 'email';}},
    isVerified: { type: Boolean, default: false },
    otp: { type: String }, // Store OTP
    googleId: { type: String },
    otpExpires: { type: Date }, // OTP expiration time
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

const Customer = mongoose.model('Customer', userSchema);

module.exports = Customer;
