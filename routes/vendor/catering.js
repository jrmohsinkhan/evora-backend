const express = require('express');
const CateringService = require('../../models/Catering'); // Ensure path is correct

const router = express.Router();

// Create catering service
router.post('/create', async (req, res) => {
    try {
        const {
            vendorId,
            name,
            area,
            timing,
            price,
            cuisine,
            image,
            images,
            rating,
            reviews,
        } = req.body;

        // Validate required fields
        if (!vendorId || !name || !area || !timing || !price || !cuisine) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const catering = await CateringService.create({
            vendorId,
            name,
            area,
            timing,
            price,
            cuisine,
            image,
            images: images || [],
            rating: rating || 0,
            reviews: reviews || 0,
        });

        res.status(201).json(catering);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get all catering services
router.get('/', async (req, res) => {
    try {
        const caterings = await CateringService.find();
        res.status(200).json(caterings);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params
        const caterings = await CateringService.find({ vendorId })
        res.status(200).json(caterings)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

// Get a catering service by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const catering = await CateringService.findById(id);

        if (!catering) {
            return res.status(404).json({ message: 'Catering service not found' });
        }

        res.status(200).json(catering);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Update a catering service
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            area,
            timing,
            price,
            cuisine,
            image,
            images,
            rating,
            reviews,
        } = req.body;

        const catering = await CateringService.findByIdAndUpdate(
            id,
            {
                name,
                area,
                timing,
                price,
                cuisine,
                image,
                images: images || [],
                rating,
                reviews,
            },
            { new: true }
        );

        if (!catering) {
            return res.status(404).json({ message: 'Catering service not found' });
        }

        res.status(200).json(catering);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Delete a catering service
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CateringService.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Catering service not found' });
        }

        res.status(200).json({ message: 'Catering service deleted successfully' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
