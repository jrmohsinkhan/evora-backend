const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const sendEmail = require('../utils/sendEmail');
const generateOtp = require('../utils/generateOtp');
const rateLimit = require('express-rate-limit');
// const passport = require('passport');
// const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

const router = express.Router();

// OTP Verification Rate Limit
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many OTP requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Vendor Registration Route
router.post('/register', async (req, res) => {
    const { name, email, password, role, businessName, phone, address } = req.body;

    try {
        // Password Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                msg: 'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.',
            });
        }

        let vendor = await Vendor.findOne({ email });
        if (vendor) return res.status(400).json({ msg: 'Vendor already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp(); // OTP generation utility
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 mins

        vendor = new Vendor({
            name,
            email,
            password: hashedPassword,
            role,
            businessName,
            phone,
            address,
            otp,
            otpExpires,
            provider: 'email',
        });

        await vendor.save();

        // Send OTP Email to Vendor
        await sendEmail(email, 'Vendor OTP Verification', `Your OTP for verification is: ${otp}`);

        res.json({ msg: 'Vendor registration successful. OTP sent to your email for verification.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// OTP Verification Route
router.post('/verify-otp', otpLimiter, async (req, res) => {
    const { email, otp } = req.body;

    try {
        const vendor = await Vendor.findOne({ email });
        if (!vendor) return res.status(400).json({ msg: 'Vendor not found' });
        if (vendor.isVerified) return res.status(400).json({ msg: 'Vendor already verified' });

        if (vendor.otp !== otp || vendor.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        vendor.isVerified = true;
        vendor.otp = null;
        vendor.otpExpires = null;
        await vendor.save();

        res.json({ msg: 'Vendor email verified successfully. You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Resend OTP Route
router.post('/resend-otp', otpLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        const vendor = await Vendor.findOne({ email });
        if (!vendor) return res.status(400).json({ msg: 'Vendor not found' });

        // Generate new OTP
        const newOtp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

        vendor.otp = newOtp;
        vendor.otpExpires = otpExpires;
        await vendor.save();

        // Send OTP via email
        await sendEmail(email, 'Vendor OTP Verification', `Your new OTP is: ${newOtp}`);

        res.json({ msg: 'New OTP sent to your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const vendor = await Vendor.findOne({ email });
        if (!vendor) return res.status(400).json({ msg: 'Invalid credentials' });

        // Check if the vendor is verified
        if (!vendor.isVerified) {
            return res.status(403).json({ msg: 'Please verify your email before logging in.' });
        }

        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: vendor._id, role: vendor.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, vendor });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Vendor Profile Route
router.get('/vendor/profile', authMiddleware, async (req, res) => {
    try {
        return res.json({ vendor: req.vendor });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update Vendor Profile Route
router.put('/vendor/profile/update', authMiddleware, async (req, res) => {
    const { name, email, password, role, businessName, phone, address } = req.body;

    try {
        const vendor = req.vendor; // Get vendor directly from auth middleware

        if (password) {
            vendor.password = await bcrypt.hash(password, 10);
        }
        vendor.name = name;
        vendor.email = email;
        vendor.role = role;
        vendor.businessName = businessName;
        vendor.phone = phone;
        vendor.address = address;
        await vendor.save();

        return res.json({ msg: 'Vendor profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
