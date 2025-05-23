const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return this.provider === "email";
    },
  },
  isVerified: { type: Boolean, default: false },
  phone: { type: String },
  address: { type: String },
  otp: { type: String }, // Store OTP
  googleId: { type: String },
  otpExpires: { type: Date }, // OTP expiration time
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profileImage: {
    type: String,
    default: "https://yourdomain.com/default-avatar.png",
  },
});

const Customer = mongoose.model("Customer", userSchema);

module.exports = Customer;
