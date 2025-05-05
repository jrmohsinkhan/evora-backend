const express = require('express');
const router = express.Router();
const DecorationService = require('../../models/Decoration');

router.post('/create', async (req, res) => {
    try {
        const { vendorId, description, location, pricePerUnit, rating, numberOfReviews, images, serviceType, theme, availability } = req.body;
        const decoration = await DecorationService.create({ vendorId, description, location, pricePerUnit, rating, numberOfReviews, images, serviceType, theme, availability });
        res.status(201).json(decoration);
    } catch (error) {
        res.status(500).json({ message: 'Error creating decoration', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const decorations = await DecorationService.find();
        res.status(200).json(decorations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching decorations', error: error.message });
    }
});

router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const decorations = await DecorationService.find({ vendorId });
        res.status(200).json(decorations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vendor decorations', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const decoration = await DecorationService.findById(req.params.id);
        if (!decoration) {
            return res.status(404).json({ message: 'Decoration not found' });
        }
        res.status(200).json(decoration);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching decoration', error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const decoration = await DecorationService.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!decoration) {
            return res.status(404).json({ message: 'Decoration not found' });
        }
        res.status(200).json(decoration);
    } catch (error) {
        res.status(500).json({ message: 'Error updating decoration', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const decoration = await DecorationService.findByIdAndDelete(req.params.id);
        if (!decoration) {
            return res.status(404).json({ message: 'Decoration not found' });
        }
        res.status(200).json({ message: 'Decoration deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting decoration', error: error.message });
    }
});

module.exports = router;







