const express = require('express');
const router = express.Router();
const customerAuth = require('../../middleware/authCustomer');
const Hall = require('../../models/Hall');
const Catering = require('../../models/Catering');
const Car = require('../../models/Car');
const Booking = require('../../models/Booking');


// Create a new booking
router.post('/', customerAuth, async (req, res) => {
    try {
        const { serviceType, serviceId, bookingDate, eventStart, eventEnd, location, totalAmount } = req.body;

        // Validate required fields
        if (!serviceType || !serviceId || !bookingDate || !eventStart || !eventEnd || !location || !totalAmount) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        // Check if the service exists
        let service;
        switch (serviceType) {
            case 'hall':
                service = await Hall.findById(serviceId);
                break;
            case 'catering':
                service = await Catering.findById(serviceId);
                break;
            case 'car':
                service = await Car.findById(serviceId);
                break;
            default:
                return res.status(400).json({ msg: 'Invalid service type' });
        }

        // Check if the service is available for the booking date
        // const isAvailable = await service.isAvailable(bookingDate, eventStart, eventEnd);
        // if (!isAvailable) {
        //     return res.status(400).json({ msg: 'Service is not available for the selected date and time' });
        // }

        // Create the booking
        const booking = new Booking({
            customer: req.customer.id,
            serviceType,
            service: serviceId,
            bookingDate,
            eventStart,
            eventEnd,
            location,
            totalAmount
        });

        // Save the booking
        await booking.save();

        res.status(201).json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get all bookings for a customer
router.get('/', customerAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.customer.id });
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get a single booking by ID
router.get('/:id', customerAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update a booking
router.put('/:id', customerAuth, async (req, res) => {
    try {
        const { serviceType, serviceId, bookingDate, eventStart, eventEnd, location, totalAmount } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, {
            serviceType,
            service: serviceId,
            bookingDate,
            eventStart,
            eventEnd,
            location,
            totalAmount
        }, { new: true });
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete a booking
router.delete('/:id', customerAuth, async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Booking deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;






