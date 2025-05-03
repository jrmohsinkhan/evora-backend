const express = require('express');
const router = express.Router()
const Hall = require('../models/Hall')

// Input validation middleware
const validateReviewInput = (req, res, next) => {
    const { rating, comment } = req.body
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }
    if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: 'Comment is required' })
    }
    next()
}

router.post('/create', async (req, res) => {
    try {
        const {
            title,
            description,
            location,
            pricePerUnit,
            images,
            capacity,
            hasParking,
            indoor,
            vendorId
        } = req.body

        // Validate required fields
        if (!title || !vendorId || !pricePerUnit) {
            return res.status(400).json({ message: 'Missing required fields' })
        }

        const hall = await Hall.create({
            title,
            description,
            location,
            pricePerUnit,
            images: images || [],
            capacity,
            hasParking,
            indoor,
            vendorId
        })
        res.status(201).json(hall)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/', async (req, res) => {
    try{
        const halls = await Hall.find()
        res.status(200).json(halls)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.get('/:id', async (req, res) => {
    try{
        const {id} = req.params
        const hall = await Hall.findById(id)
        res.status(200).json(hall)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const {
            title,
            description,
            location,
            pricePerUnit,
            images,
            capacity,
            hasParking,
            indoor
        } = req.body

        const hall = await Hall.findByIdAndUpdate(
            id,
            {
                title,
                description,
                location,
                pricePerUnit,
                images: images || [],
                capacity,
                hasParking,
                indoor
            },
            { new: true }
        )
        if (!hall) {
            return res.status(404).json({ message: 'Hall service not found' })
        }
        res.status(200).json(hall)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const {id} = req.params
        await Hall.findByIdAndDelete(id)
        res.status(200).json({message: 'Hall deleted successfully'})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})


module.exports = router