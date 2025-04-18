const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return this.provider === 'email';}},
    role: { type: String, enum: ['vendor', 'customer'], required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String }, // Store OTP
    googleId: { type: String },
    otpExpires: { type: Date }, // OTP expiration time
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;
