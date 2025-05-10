const express = require('express');
const router = express.Router();
const vendorAuth = require('../../middleware/authVendor');
const Vendor = require('../../models/vendor');

// Get Profile
router.get('/get', vendorAuth, async (req, res) => {
    try {
        console.log(req.vendor.id);
        const vendor = await Vendor.findById(req.vendor.id).select('-password -otp -otpExpires -isVerified');
        if (!vendor) return res.status(404).json({ msg: 'Vendor not found' });
        res.json(vendor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update Vendor Profile
router.put('/update', vendorAuth, async (req, res) => {
    try {
        const allowedUpdates = [
            'name',
            'profileImage',
            'businessName',
            'phone',
            'address'
        ];

        // Filter only allowed fields from req.body
        const updates = {};
        for (let key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.vendor.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password -otp -otpExpires -isVerified');

        res.json(updatedVendor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});


module.exports = router;
