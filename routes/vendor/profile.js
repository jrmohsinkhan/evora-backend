const express = require("express");
const router = express.Router();
const vendorAuth = require("../../middleware/authVendor");
const Vendor = require("../../models/vendor");

// Get Profile
router.get("/get", vendorAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).select(
      "-password -otp -otpExpires -isVerified"
    );
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


router.post("/upload", vendorAuth, async (req, res) => {
    try {
      const { imageBase64 } = req.body;
  
      if (!imageBase64 || !imageBase64.startsWith("data:image")) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      const vendor = await Vendor.findById(req.vendor.id);
      vendor.profileImage = imageBase64;
      await vendor.save();
      // Just echo the same string back — it will be stored directly
      res.status(200).json({ imageUrl: imageBase64 });
    } catch (err) {
      console.error("Base64 Upload Error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
  

module.exports = router;

  

// Update Vendor Profile
router.put("/update", vendorAuth, async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "profileImage",
      "businessName",
      "phone",
      "address",
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
    ).select("-password -otp -otpExpires -isVerified");

    res.json(updatedVendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
