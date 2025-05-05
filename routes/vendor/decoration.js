const express = require('express');
const router = express.Router();
const DecorationService = require('../../models/Decoration');

/**
 * @swagger
 * /vendor/decoration/create:
 *   post:
 *     summary: Create a new decoration service
 *     tags: [Decoration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - description
 *               - location
 *               - pricePerUnit
 *             properties:
 *               vendorId:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               pricePerUnit:
 *                 type: number
 *               rating:
 *                 type: number
 *               numberOfReviews:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               serviceType:
 *                 type: string
 *               theme:
 *                 type: string
 *               availability:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Decoration service created successfully
 *       500:
 *         description: Server error
 */
router.post('/create', async (req, res) => {
    try {
        const { vendorId, description, location, pricePerUnit, rating, numberOfReviews, images, serviceType, theme, availability } = req.body;
        const decoration = await DecorationService.create({ vendorId, description, location, pricePerUnit, rating, numberOfReviews, images, serviceType, theme, availability });
        res.status(201).json(decoration);
    } catch (error) {
        res.status(500).json({ message: 'Error creating decoration', error: error.message });
    }
});

/**
 * @swagger
 * /vendor/decoration/:
 *   get:
 *     summary: Get all decoration services
 *     tags: [Decoration]
 *     responses:
 *       200:
 *         description: List of all decoration services
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const decorations = await DecorationService.find();
        res.status(200).json(decorations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching decorations', error: error.message });
    }
});

/**
 * @swagger
 * /vendor/decoration/vendor/{vendorId}:
 *   get:
 *     summary: Get decoration services by vendor ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vendor
 *     responses:
 *       200:
 *         description: List of decoration services by vendor
 *       500:
 *         description: Server error
 */
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const decorations = await DecorationService.find({ vendorId });
        res.status(200).json(decorations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vendor decorations', error: error.message });
    }
});

/**
 * @swagger
 * /vendor/decoration/{id}:
 *   get:
 *     summary: Get a decoration service by ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the decoration service
 *     responses:
 *       200:
 *         description: Decoration service found
 *       404:
 *         description: Decoration service not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /vendor/decoration/{id}:
 *   put:
 *     summary: Update a decoration service by ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the decoration service to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update in the decoration service
 *     responses:
 *       200:
 *         description: Decoration service updated successfully
 *       404:
 *         description: Decoration service not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /vendor/decoration/{id}:
 *   delete:
 *     summary: Delete a decoration service by ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the decoration service to delete
 *     responses:
 *       200:
 *         description: Decoration service deleted successfully
 *       404:
 *         description: Decoration service not found
 *       500:
 *         description: Server error
 */
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







