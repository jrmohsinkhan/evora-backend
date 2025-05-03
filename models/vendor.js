const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function () { return this.provider === 'email'; }},
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  googleId: { type: String },
  otpExpires: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // 🔽 Additional vendor-specific fields (optional, scalable)
  businessName: { type: String },
  phone: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true } // For admin control
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
