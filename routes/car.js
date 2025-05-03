const express = require('express')
const router = express.Router()
const Car = require('../models/Car')

const validateCarInput = (req, res, next) => {
    const { brand, model, seats, year, pricePerUnit, location } = req.body
    if (!brand || !model || !seats || !year || !pricePerUnit || !location) {
        return res.status(400).json({ message: 'Missing required fields' })
    }
    if (seats < 1 || pricePerUnit < 0 || year < 1900) {
        return res.status(400).json({ message: 'Invalid values provided' })
    }
    next()
}

router.post('/create', validateCarInput, async (req, res) => {
    try {
        const { seats, year, brand, model, images, pricePerUnit, description, location, vendorId } = req.body
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

router.get('/', async (req, res) => {
    try {
        const cars = await Car.find()
        res.status(200).json(cars)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})


router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const car = await Car.findById(id)
        res.status(200).json(car)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.put('/:id', validateCarInput, async (req, res) => {
    try {
        const { id } = req.params
        const { seats, year, brand, model, images, pricePerUnit, description, location } = req.body
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
                location
            }, 
            { new: true }
        )
        if (!car) {
            return res.status(404).json({ message: 'Car not found' })
        }
        res.status(200).json(car)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        await Car.findByIdAndDelete(id)
        res.status(200).json({ message: 'Car deleted successfully' })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})


module.exports = router 