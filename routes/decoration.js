const express = require('express');
const router = express.Router();
const DecorationService = require('../models/Decoration');

router.post('/create', async (req, res) => {
    const { vendorId, description, location, pricePerUnit, rating, numberOfReviews, images, serviceType, theme, availability } = req.body;

    const decoration = await DecorationService.create({ vendorId, description, location, pricePerUnit, rating, numberOfReviews, images, serviceType, theme, availability });
    res.status(201).json(decoration);
});

router.get('/', async (req, res) => {
    const decorations = await DecorationService.find();
    res.status(200).json(decorations);
});

router.get('/:id', async (req, res) => {
    const decoration = await DecorationService.findById(req.params.id);
    res.status(200).json(decoration);
});

router.put('/:id', async (req, res) => {
    const decoration = await DecorationService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(decoration);
});

router.delete('/:id', async (req, res) => {
    await DecorationService.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Decoration deleted successfully' });
});







