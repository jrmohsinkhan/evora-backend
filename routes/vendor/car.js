const express = require('express')
const router = express.Router()
const Car = require('../../models/Car')
const authVendor = require('../../middleware/authVendor')

/**
 * @swagger
 * /vendor/car/create:
 *   post:
 *     summary: Create a new car listing
 *     tags: [Cars]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seats
 *               - year
 *               - brand
 *               - model
 *               - pricePerUnit
 *               - description
 *               - location
 *               - vendorId
 *             properties:
 *               seats:
 *                 type: number
 *               year:
 *                 type: number
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               pricePerUnit:
 *                 type: number
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               vendorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Car created successfully
 *       500:
 *         description: Server error
 */
router.post('/create',authVendor, async (req, res) => {
    try {
        const { seats, year, brand, model, images, pricePerUnit, description, location } = req.body
        const vendorId = req.vendor.id
        const car = await Car.create({
            seats,
            year,
            brand,
            model,
            images: images || [],
            pricePerUnit,
            description,
            location,
            vendorId
        })
        res.status(201).json(car)
    } catch (e) {
        res.status(500).json({ message: 'Failed to create car', error: e.message })
    }
})

/**
 * @swagger
 * /vendor/car:
 *   get:
 *     summary: Get all cars
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of all cars
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const cars = await Car.find()
        res.status(200).json(cars)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

/**
 * @swagger
 * /vendor/car/vendor/{vendorId}:
 *   get:
 *     summary: Get all cars by vendor ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vendor
 *     responses:
 *       200:
 *         description: List of cars for the vendor
 *       500:
 *         description: Server error
 */
router.get('/vendor', authVendor, async (req, res) => {
    try {
        const vendorId = req.vendor.id
        const cars = await Car.find({ vendorId })
        res.status(200).json(cars)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

/**
 * @swagger
 * /vendor/car/{id}:
 *   get:
 *     summary: Get a car by ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the car
 *     responses:
 *       200:
 *         description: Car details
 *       500:
 *         description: Server error
 */
router.get('/:id',authVendor, async (req, res) => {
    try {
        const { id } = req.params
        const car = await Car.findById(id)
        res.status(200).json(car)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

/**
 * @swagger
 * /vendor/car/{id}:
 *   put:
 *     summary: Update a car
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the car
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seats:
 *                 type: number
 *               year:
 *                 type: number
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               pricePerUnit:
 *                 type: number
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       404:
 *         description: Car not found
 *       500:
 *         description: Server error
 */
router.put('/:id',authVendor, async (req, res) => {
    try {
        const { id } = req.params
        const vendorId = req.vendor.id
        const { seats, year, brand, model, images, pricePerUnit, description, location } = req.body

        // First find the car to check vendor ownership
        const existingCar = await Car.findById(id)
        if (!existingCar) {
            return res.status(404).json({ message: 'Car not found' })
        }

        // Check if the car belongs to the vendor
        if (existingCar.vendorId.toString() !== vendorId) {
            return res.status(403).json({ message: 'Not authorized to update this car' })
        }

        const car = await Car.findByIdAndUpdate(
            id, 
            { 
                seats,
                year,
                brand,
                model,
                images: images || [],
                pricePerUnit,
                description,
                location,
                vendorId
            }, 
            { new: true }
        )
        
        res.status(200).json(car)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

/**
 * @swagger
 * /vendor/car/{id}:
 *   delete:
 *     summary: Delete a car
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the car
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       500:
 *         description: Server error
 */
router.delete('/:id',authVendor, async (req, res) => {
    try {
        const { id } = req.params
        const vendorId = req.vendor.id

        // First find the car to check vendor ownership
        const existingCar = await Car.findById(id)
        if (!existingCar) {
            return res.status(404).json({ message: 'Car not found' })
        }

        // Check if the car belongs to the vendor
        if (existingCar.vendorId.toString() !== vendorId) {
            return res.status(403).json({ message: 'Not authorized to delete this car' })
        }
        await Car.findByIdAndDelete(id)
        res.status(200).json({ message: 'Car deleted successfully' })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

module.exports = router 