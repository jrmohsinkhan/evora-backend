const express = require("express");
const router = express.Router();
const Hall = require("../../models/Hall");
const Catering = require("../../models/Catering");
const Car = require("../../models/Car");
const Decoration = require("../../models/Decoration");
const Booking = require("../../models/Booking");
const Customer = require("../../models/customer");
const authVendor = require("../../middleware/authVendor");

router.get("/", authVendor, async (req, res) => {
  try {
    const bookings = await Booking.aggregate([
      {
        $match: {
          vendor: req.vendor._id,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: "$customer",
      },
    ]);
    res.status(200).json(
      bookings.map((booking) => ({
        id: booking._id,
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone,
        service: booking.service,
        serviceType: booking.serviceType,
        bookingDate: booking.bookingDate,
        status: booking.status,
        startTime: booking.eventStart,
        endTime: booking.eventEnd,
        date: booking.bookingDate,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
// Create a new booking
router.post("/", authVendor, async (req, res) => {
  try {
    const {
      serviceType,
      serviceId,
      bookingDate,
      eventStart,
      eventEnd,
      location,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;
    const vendorId = req.vendor._id;

    // Validate required fields
    if (
      !serviceType ||
      !serviceId ||
      !bookingDate ||
      !eventStart ||
      !eventEnd ||
      !location ||
      !totalAmount
    ) {
      return res.status(400).json({ msg: "All service fields are required" });
    }

    // Validate customer data
    if (!customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ msg: "Customer information is required" });
    }

    // Check if the service exists
    let service;
    switch (serviceType) {
      case "hall":
        service = await Hall.findById(serviceId);
        break;
      case "catering":
        service = await Catering.findById(serviceId);
        break;
      case "car":
        service = await Car.findById(serviceId);
        break;
      case "decoration":
        service = await Decoration.findById(serviceId);
        break;
      default:
        return res.status(400).json({ msg: "Invalid service type" });
    }

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }
    if (service.vendorId !== vendorId) {
      return res
        .status(403)
        .json({ msg: "You are not authorized to book this service" });
    }

    // Check for booking clashes
    const existingBookings = await Booking.find({
      service: serviceId,
      serviceType: serviceType,
      status: { $ne: "cancelled" },
      $or: [
        // Check if new booking starts during an existing booking
        {
          eventStart: { $lte: eventStart },
          eventEnd: { $gt: eventStart },
        },
        // Check if new booking ends during an existing booking
        {
          eventStart: { $lt: eventEnd },
          eventEnd: { $gte: eventEnd },
        },
        // Check if new booking completely contains an existing booking
        {
          eventStart: { $gte: eventStart },
          eventEnd: { $lte: eventEnd },
        },
      ],
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({
        msg: "This time slot is already booked. Please choose a different time.",
        existingBookings: existingBookings.map((booking) => ({
          start: booking.eventStart,
          end: booking.eventEnd,
        })),
      });
    }

    // Create or find customer
    let customer = await Customer.findOne({ email: customerEmail });

    if (!customer) {
      // Create new customer for offline booking
      customer = new Customer({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        isVerified: true, // Since this is an offline booking
      });
      await customer.save();
    }

    // Create the booking
    const booking = new Booking({
      customer: customer._id,
      serviceType,
      service: serviceId,
      vendor: service.vendorId,
      bookingDate,
      eventStart,
      eventEnd,
      location,
      totalAmount,
      status: "confirmed", // Since this is an offline booking
      paymentStatus: "paid", // Assuming offline payment is already made
    });

    // Save the booking
    await booking.save();

    res.status(201).json({
      booking,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update a booking
router.put("/:id", async (req, res) => {
  try {
    const {
      serviceType,
      serviceId,
      bookingDate,
      eventStart,
      eventEnd,
      location,
      totalAmount,
    } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        serviceType,
        service: serviceId,
        bookingDate,
        eventStart,
        eventEnd,
        location,
        totalAmount,
      },
      { new: true }
    );
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete a booking
router.delete("/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ msg: "Booking deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
