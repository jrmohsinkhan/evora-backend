const mongoose = require('mongoose');
const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  businessName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  provider: {
    type: String,
    default: 'email'
  },
  role: {
    type: String,
    default: 'vendor'
  },
  rating: {
    type: Number,
    default: 0
  },
  numberOfReviews: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

module.exports = mongoose.model('vendors', VendorSchema);
