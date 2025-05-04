const express = require('express');
const router = express.Router();
const customerAuth = require('../../middleware/authCustomer');
const Customer = require('../../models/customer');

// Get Profile
router.get('/get', customerAuth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer.id).select('-password -otp -otpExpires -isVerified');
        if (!customer) return res.status(404).json({ msg: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update Customer Profile
router.put('/update', customerAuth, async (req, res) => {
    try {
        const allowedUpdates = [
            'name',
            'profileImage',
        ];

        const updates = {};
        for (let key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.customer.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password -otp -otpExpires -isVerified');

        res.json(updatedCustomer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});


module.exports = router;
