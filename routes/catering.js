const express = require('express')
const Catering = require('../models/Catering')

const router = express.Router()

router.post('/create', async (req, res) => {
    try {
        const {
            title,
            description,
            location,
            pricePerUnit,
            images,
            cuisineTypes,
            perHeadCost,
            includesDecor,
            vendorId
        } = req.body

        // Validate required fields
        if (!title || !vendorId || !pricePerUnit) {
            return res.status(400).json({ message: 'Missing required fields' })
        }

        const catering = await Catering.create({
            title,
            description,
            location,
            pricePerUnit,
            images: images || [],
            cuisineTypes: cuisineTypes || [],
            perHeadCost,
            includesDecor,
            vendorId
        })
        res.status(201).json(catering)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/', async (req, res) => {
    try{
        const caterings = await Catering.find()
        res.status(200).json(caterings)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.get('/:id', async (req, res) => {
    try{
        const {id} = req.params
        const catering = await Catering.findById(id)
        res.status(200).json(catering)  
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
            cuisineTypes,
            perHeadCost,
            includesDecor
        } = req.body

        const catering = await Catering.findByIdAndUpdate(
            id,
            {
                title,
                description,
                location,
                pricePerUnit,
                images: images || [],
                cuisineTypes: cuisineTypes || [],
                perHeadCost,
                includesDecor
            },
            { new: true }
        )
        if (!catering) {
            return res.status(404).json({ message: 'Catering service not found' })
        }
        res.status(200).json(catering)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const {id} = req.params
        await Catering.findByIdAndDelete(id)
        res.status(200).json({message: 'Catering deleted successfully'})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

module.exports = router