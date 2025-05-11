const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Vendor = require("../../models/vendor");
const sendEmail = require("../../utils/sendEmail");
const generateOtp = require("../../utils/generateOtp");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const crypto = require("crypto");
const otpLimiter = require("../../utils/rateLimiter");
require("dotenv").config();

const router = express.Router();

// Vendor Google OAuth Routes
router.get(
  "/google/vendor",
  passport.authenticate("google-vendor", { scope: ["profile", "email"] })
);

router.get(
  "/google/vendor/callback",
  passport.authenticate("google-vendor", {
    session: false,
    failureRedirect: "/",
  }),
  (req, res) => {
    const vendor = req.user;
    const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token_vendor", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Or 'Lax' if your frontend/backend are on different subdomains
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.redirect(`http://localhost:8081/auth/oauth-success`);
  }
);

// Vendor Registration Route
router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    businessName,
    phone,
    address,
  } = req.body; // Added confirmPassword

  try {
    // Password Validation - Before checking if passwords match
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match",
      });
    }

    // Check if the vendor already exists
    let vendor = await Vendor.findOne({ email });
    if (vendor) return res.status(400).json({ error: "User already exists" });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and expiration
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Create a new vendor instance
    vendor = new Vendor({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
      provider: "email", // We use 'email' as provider here.
      businessName,
      phone,
      address,
    });

    // Save the vendor to the database
    await vendor.save();

    // Send OTP Email
    await sendEmail(email, "Evora OTP Verification", `Your OTP is: ${otp}`);

    // Respond to the client
    res.json({
      msg: "Registration successful. Please check your email for OTP.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Vendor Login Route (Email and Password)
router.post("/verify-otp", otpLimiter, async (req, res) => {
  const { email, otp } = req.body;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ error: "User not found" });
    if (vendor.isVerified)
      return res.status(400).json({ error: "User already verified" });

    if (vendor.otp !== otp || vendor.otpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    vendor.isVerified = true;
    vendor.otp = null;
    vendor.otpExpires = null;
    await vendor.save();

    res.json({ msg: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Resend OTP Route
router.post("/resend-otp", otpLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ error: "User not found" });

    // Check if the vendor is already verified
    if (vendor.isVerified)
      return res.status(400).json({ error: "User already verified" });

    // Generate new OTP
    const newOtp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

    vendor.otp = newOtp;
    vendor.otpExpires = otpExpires;
    await vendor.save();

    // Send OTP via email (implement email sending here)
    await sendEmail(email, "Evora OTP Verification", `Your OTP is: ${newOtp}`);

    res.json({ msg: "New OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ error: "Invalid Credentials" });

    if (!vendor.isVerified) {
      return res
        .status(403)
        .json({ error: "Account not verified. Please verify your email." });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });

    const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set token in HttpOnly cookie
    res.cookie("token_vendor", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Or 'Lax' if your frontend/backend are on different subdomains
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // You can still return basic user info (without token)
    res.status(200).json({
      msg: "Login successful",
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// logout Route
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token_vendor", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.status(200).json({ msg: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const vendor = await Vendor.findOne({ email });
  if (!vendor) return res.status(404).json({ error: "User not found" });

  if (!vendor.isVerified) {
    return res
      .status(403)
      .json({ error: "Account not verified. Please verify your email first." });
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  vendor.resetPasswordToken = tokenHash;
  vendor.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await vendor.save();

  // Email content
  const resetURL = `http://localhost:8081/auth/reset-password/${resetToken}`;
  const message = `
        You requested a password reset for your Evora account.\n
        Click the link below to reset your password:\n
        ${resetURL}\n
        This link is valid for 1 hour.\n
        If you did not request this, please ignore this email.
    `;

  await sendEmail(vendor.email, "Evora Password Reset", message);

  res.status(200).json({ message: "Reset email sent" });
});

// Reset Password Route
router.post("/reset-password/:token", async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  // Step 1: Validate inputs
  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Both password fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  // Password Validation - Before checking if passwords match
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error:
        "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  // Step 2: Hash the token and find vendor
  const tokenHash = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const vendor = await Vendor.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!vendor) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  if (!vendor.isVerified) {
    return res
      .status(403)
      .json({ error: "Account not verified. Please verify your email first." });
  }

  // Step 3: Set new password and clear reset fields
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  vendor.password = hashedPassword;
  vendor.resetPasswordToken = undefined;
  vendor.resetPasswordExpires = undefined;

  await vendor.save();

  res.status(200).json({ message: "✅ Password has been reset successfully" });
});

// Get Vendor Profile Route
router.get("/profile", async (req, res) => {
  try {
    // Get token from cookie
    const token = req.cookies.token_vendor;
    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get vendor profile
    const vendor = await Vendor.findById(decoded.id).select(
      "-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires"
    );
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    res.json(vendor);
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Invalid token" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// Update Vendor Profile Route
router.put("/profile", async (req, res) => {
  try {
    // Get token from cookie
    const token = req.cookies.token_vendor;
    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find vendor
    const vendor = await Vendor.findById(decoded.id);
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    const { name, businessName, phone, address } = req.body;

    // Update fields
    if (name) vendor.name = name;
    if (businessName) vendor.businessName = businessName;
    if (phone) vendor.phone = phone;
    if (address) vendor.address = address;

    // Save updated vendor
    await vendor.save();

    // Return updated vendor (excluding sensitive information)
    const updatedVendor = await Vendor.findById(decoded.id).select(
      "-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires"
    );
    res.json(updatedVendor);
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Invalid token" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
