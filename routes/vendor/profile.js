const express = require("express");
const router = express.Router();
const vendorAuth = require("../../middleware/authVendor");
const Vendor = require("../../models/vendor");
const multer = require("multer");
const cloudinary = require("../../utils/cloudinary"); 
const storage = multer.memoryStorage();
const upload = multer({ storage });


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


router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    const base64Str = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64Str}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "vendor_profiles",
    });

    res.status(200).json({ imageUrl: uploadResult.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cloudinary upload failed" });
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
