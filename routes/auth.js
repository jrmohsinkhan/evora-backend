const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const generateOtp = require('../utils/generateOtp');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const crypto = require("crypto");
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

// Start Google OAuth flow
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req, res) => {
        const user = req.user;
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Optional: redirect with token in query (for mobile/web frontend)
        res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
    }
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user and send OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, vendor]
 *     responses:
 *       200:
 *         description: Registration successful, OTP sent
 *       400:
 *         description: User already exists or password invalid
 *       500:
 *         description: Server error
 */
// Register Route with OTP
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Password Validation - Before hashing it
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                msg: 'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.',
            });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 mins

        user = new User({ name, email, password: hashedPassword, role, otp, otpExpires, provider: 'email' });
        await user.save();

        // Send OTP Email
        await sendEmail(email, 'Evora OTP Verification', `Your OTP is: ${otp}`);

        res.json({ msg: 'Registration successful. Please check your email for OTP.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify user's email with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
// Verify OTP Route
router.post('/verify-otp', otpLimiter, async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found' });
        if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ msg: 'Email verified successfully. You can now log in.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP to user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: User not found or already verified
 *       500:
 *         description: Server error
 */
// Resend OTP Route
router.post('/resend-otp', otpLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found' });

        // Generate new OTP
        const newOtp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

        user.otp = newOtp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP via email (implement email sending here)
        await sendEmail(email, 'Evora OTP Verification', `Your OTP is: ${newOtp}`);

        res.json({ msg: 'New OTP sent to your email' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT and user data
 *       400:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified
 *       500:
 *         description: Server error
 */
// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        // Check if the user is verified
        console.log(!user.isVerified);
        if (!user.isVerified) {
            return res.status(403).json({ msg: 'Account not verified. Please verify your email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send a password reset link to the user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Email content
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    const message = `
        You requested a password reset for your Evora account.\n
        Click the link below to reset your password:\n
        ${resetURL}\n
        This link is valid for 1 hour.\n
        If you did not request this, please ignore this email.
    `;

    await sendEmail(user.email, 'Evora Password Reset', message);

    res.status(200).json({ message: "Reset email sent" });
});

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset the user's password using a valid token
 *     tags: [Auth]
 *     parameters:
 *       - name: token
 *         in: path
 *         description: The reset token sent to the user's email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: The new password to be set
 *                 example: "NewPassword123!"
 *               confirmPassword:
 *                 type: string
 *                 description: The confirmation of the new password
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *       400:
 *         description: Invalid or expired token, or passwords do not match
 *       500:
 *         description: Server error
 */
// Reset Password Route
router.post("/reset-password/:token", async (req, res) => {
    const { newPassword, confirmPassword } = req.body;

    // Step 1: Validate inputs
    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Both password fields are required" });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    // Step 2: Hash the token and find user
    const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Step 3: Set new password and clear reset fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "✅ Password has been reset successfully" });
});


module.exports = router;
