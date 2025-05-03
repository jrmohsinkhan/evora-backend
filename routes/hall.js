const express = require('express');
const router = express.Router();
const Hall = require('../models/Hall');

// Create a new hall
router.post('/create', async (req, res) => {
    try {
        const {
            vendorId,
            name,
            type,
            description,
            location,
            price,
            price_per_person,
            rating,
            reviews,
            capacity,
            timing,
            image,
            images,
            video,
            hasParking,
            indoor,
        } = req.body;

        // Validate required fields
        if (!vendorId || !name || !type || price === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const hall = await Hall.create({
            vendorId,
            name,
            type,
            description,
            location,
            price,
            price_per_person,
            rating,
            reviews,
            capacity,
            timing,
            image,
            images: images || [],
            video,
            hasParking,
            indoor,
        });

        res.status(201).json(hall);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get all halls
router.get('/', async (req, res) => {
    try {
        const halls = await Hall.find();
        res.status(200).json(halls);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get a specific hall by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const hall = await Hall.findById(id);
        if (!hall) {
            return res.status(404).json({ message: 'Hall not found' });
        }
        res.status(200).json(hall);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Update a hall
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const hall = await Hall.findByIdAndUpdate(id, updateData, { new: true });
        if (!hall) {
            return res.status(404).json({ message: 'Hall not found' });
        }

        res.status(200).json(hall);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Delete a hall
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Hall.findByIdAndDelete(id);
        res.status(200).json({ message: 'Hall deleted successfully' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
