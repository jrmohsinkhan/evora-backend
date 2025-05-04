const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../../models/customer');
const sendEmail = require('../../utils/sendEmail');
const generateOtp = require('../../utils/generateOtp');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const crypto = require("crypto");
const otpLimiter = require('../../utils/rateLimiter');
require('dotenv').config();

const router = express.Router();



// Customer Google OAuth Routes
router.get('/google/customer',
    passport.authenticate('google-customer', { scope: ['profile', 'email'] })
);

router.get('/google/customer/callback',
    passport.authenticate('google-customer', { session: false, failureRedirect: '/' }),
    (req, res) => {
        const customer = req.user;
        const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
    }
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new customer and send OTP
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
    const { name, email, password, confirmPassword } = req.body;  // Added confirmPassword

    try {
        // Password Validation - Before checking if passwords match
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                msg: 'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.',
            });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                msg: 'Passwords do not match',
            });
        }

        // Check if the customer already exists
        let customer = await Customer.findOne({ email });
        if (customer) return res.status(400).json({ msg: 'User already exists' });

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP and expiration
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Create a new customer instance
        customer = new Customer({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpires,
            provider: 'email', // We use 'email' as provider here.
        });

        // Save the customer to the database
        await customer.save();

        // Send OTP Email
        await sendEmail(email, 'Evora OTP Verification', `Your OTP is: ${otp}`);

        // Respond to the client
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
 *     summary: Verify customer's email with OTP
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
        const customer = await Customer.findOne({ email });
        if (!customer) return res.status(400).json({ msg: 'User not found' });
        if (customer.isVerified) return res.status(400).json({ msg: 'User already verified' });

        if (customer.otp !== otp || customer.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        customer.isVerified = true;
        customer.otp = null;
        customer.otpExpires = null;
        await customer.save();

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
 *     summary: Resend OTP to customer's email
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
        const customer = await Customer.findOne({ email });
        if (!customer) return res.status(400).json({ msg: 'User not found' });

        // Check if the customer is already verified
        if (customer.isVerified) return res.status(400).json({ msg: 'User already verified' });

        // Generate new OTP
        const newOtp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

        customer.otp = newOtp;
        customer.otpExpires = otpExpires;
        await customer.save();

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
 *     summary: Log in a customer
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
 *         description: Login successful, returns JWT and customer data
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
        const customer = await Customer.findOne({ email });
        if (!customer) return res.status(400).json({ msg: 'Invalid credentials' });

        if (!customer.isVerified) {
            return res.status(403).json({ msg: 'Account not verified. Please verify your email.' });
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // Create JWT Token
        const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Set token in HttpOnly cookie
        res.cookie('token_customer', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict', // Or 'Lax' if your frontend/backend are on different subdomains
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        // You can still return basic user info (without token)
        res.status(200).json({
            msg: 'Login successful',
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});
// From frontend, make sure requests have: credentials: 'include' (if using fetch) or axios.defaults.withCredentials = true.

// Logout Route
router.post('/logout', (req, res) => {
    try {
      res.clearCookie('token_customer', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      });
      res.status(200).json({ msg: 'Logged out successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send a password reset link to the customer's email
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

    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(404).json({ message: "User not found" });

    if (!customer.isVerified) {
        return res.status(403).json({ msg: 'Account not verified. Please verify your email first.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    customer.resetPasswordToken = tokenHash;
    customer.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await customer.save();

    // Email content
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    const message = `
        You requested a password reset for your Evora account.\n
        Click the link below to reset your password:\n
        ${resetURL}\n
        This link is valid for 1 hour.\n
        If you did not request this, please ignore this email.
    `;

    await sendEmail(customer.email, 'Evora Password Reset', message);

    res.status(200).json({ message: "Reset email sent" });
});

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset the customer's password using a valid token
 *     tags: [Auth]
 *     parameters:
 *       - name: token
 *         in: path
 *         description: The reset token sent to the customer's email
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

    // Step 2: Hash the token and find customer
    const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const customer = await Customer.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!customer) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (!customer.isVerified) {
        return res.status(403).json({ msg: 'Account not verified. Please verify your email first.' });
    }

    // Step 3: Set new password and clear reset fields
    customer.password = newPassword;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpires = undefined;

    await customer.save();

    res.status(200).json({ message: "✅ Password has been reset successfully" });
});


module.exports = router;
