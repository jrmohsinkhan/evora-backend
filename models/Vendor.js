const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['customer', 'vendor'], required: true },
        businessName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        otp: { type: String },
        otpExpires: { type: Date },
        isVerified: { type: Boolean, default: false },
        provider: { type: String, default: 'email' },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Vendor', VendorSchema);
