const express = require('express');
const router = express.Router();
const customerAuth = require('../../middleware/authCustomer');
const Hall = require('../../models/Hall');
const Catering = require('../../models/Catering');
const Car = require('../../models/Car');
const Booking = require('../../models/Booking');
const Decoration = require('../../models/Decoration');
const { sendNotification } = require('../../utils/notification');

router.post('/availability',async (req, res) => {
    try {
        const { serviceType, serviceId, eventStart, eventEnd } = req.body;
        const existingBookings = await Booking.find({
            service: serviceId,
            serviceType: serviceType,
            status: { $ne: 'cancelled' },
            $or: [
                // Check if new booking starts during an existing booking
                {
                    eventStart: { $lte: eventStart },
                    eventEnd: { $gt: eventStart }
                },
                // Check if new booking ends during an existing booking
                {
                    eventStart: { $lt: eventEnd },
                    eventEnd: { $gte: eventEnd }
                },
                // Check if new booking completely contains an existing booking
                {
                    eventStart: { $gte: eventStart },
                    eventEnd: { $lte: eventEnd }
                }
            ]
        });
        if (existingBookings.length > 0) {
            return res.status(200).json({ 
                msg: 'This time slot is already booked. Please choose a different time.',
                status: false,
                existingBookings: existingBookings.map(booking => ({
                    start: booking.eventStart,
                    end: booking.eventEnd
                }))
            });
        }
        res.status(200).json({ msg: 'This time slot is available', status: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' ,status: false});
    }
});
// Create a new booking
router.post('/', customerAuth, async (req, res) => {
    try {
        const { serviceType, serviceId, bookingDate, eventStart, eventEnd, location, totalAmount,otherDetails } = req.body;
        const customerId = req.customer.id;
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
            case 'decoration':
                service = await Decoration.findById(serviceId);
                break;
            default:
                return res.status(400).json({ msg: 'Invalid service type' });
        }

        if (!service) {
            return res.status(404).json({ msg: 'Service not found' });
        }

        // Check for booking clashes
        const existingBookings = await Booking.find({
            service: serviceId,
            serviceType: serviceType,
            status: { $ne: 'cancelled' },
            $or: [
                // Check if new booking starts during an existing booking
                {
                    eventStart: { $lte: eventStart },
                    eventEnd: { $gt: eventStart }
                },
                // Check if new booking ends during an existing booking
                {
                    eventStart: { $lt: eventEnd },
                    eventEnd: { $gte: eventEnd }
                },
                // Check if new booking completely contains an existing booking
                {
                    eventStart: { $gte: eventStart },
                    eventEnd: { $lte: eventEnd }
                }
            ]
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({ 
                msg: 'This time slot is already booked. Please choose a different time.',
                existingBookings: existingBookings.map(booking => ({
                    start: booking.eventStart,
                    end: booking.eventEnd
                }))
            });
        }

        // Create the booking
        const booking = new Booking({
            customer: customerId,
            serviceType,
            service: serviceId,
            vendor: service.vendorId,
            bookingDate,
            eventStart,
            eventEnd,
            location,
            totalAmount,
            otherDetails
        });

        // Save the booking
        await booking.save();

        await sendNotification(service.vendorId, "Vendor", "New Booking", "A new booking has been made", "booking_created");
        await sendNotification(customerId, "Customer", "New Booking", "A new booking has been made", "booking_created");
        res.status(201).json({msg: "Booking created successfully", booking, status: true});
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get all bookings for a customer
router.get('/', customerAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.customer.id });
        const bookingsWithService = await Promise.all(bookings.map(async (booking) => {
            let service;
            if(booking.serviceType === 'hall'){
                service = await Hall.findById(booking.service);
            }
            else if(booking.serviceType === 'catering'){
                service = await Catering.findById(booking.service);
            }
            else if(booking.serviceType === 'car'){
                service = await Car.findById(booking.service);
            }
            else if(booking.serviceType === 'decoration'){
                service = await Decoration.findById(booking.service);
            }
            
            // Convert booking to plain object and add service details
            const bookingObj = booking.toObject();
            return {
                ...bookingObj,
                image: service ? service.image || service.images[0] : null
            };
        }));
        
        res.json(bookingsWithService);
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

router.put('/:id', customerAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findOneAndUpdate({_id:req.params.id,customer:req.customer.id}, { status }, { new: true });
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;