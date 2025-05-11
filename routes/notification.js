const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const authCustomer = require("../middleware/authCustomer");
const authVendor = require("../middleware/authVendor");

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.status(200).json(notifications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/customer", authCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const notifications = await Notification.find({
      recipient: customerId,
      recipientType: "Customer",
    });
    res.status(200).json(notifications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/vendor", authVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const notifications = await Notification.find({
      recipient: vendorId,
      recipientType: "Vendor",
    });
    res.status(200).json(notifications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    res.status(200).json(notification);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const notification = await Notification.updateMany({}, { isRead: true });
    res.status(200).json(notification);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json(notification);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json(notification);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
