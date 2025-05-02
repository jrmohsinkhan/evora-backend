const express = require('express');
const router = express.Router()
const HallService = require('../services/hallService')

router.post('/create', async (req, res) => {
    try{

    const {hallName, hallType, hallCapacity, hallPrice, hallDescription, hallImage} = req.body
    const hall = await HallService.createHall(hallName, hallType, hallCapacity, hallPrice, hallDescription, hallImage)
    res.status(201).json(hall)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.get('/', async (req, res) => {
    try{
        const halls = await HallService.getAllHalls()
        res.status(200).json(halls)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.get('/:id', async (req, res) => {
    try{
        const {id} = req.params
        const hall = await HallService.getHallById(id)
        res.status(200).json(hall)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.put('/:id', async (req, res) => {
    try{
        const {id} = req.params
        const {hallName, hallType, hallCapacity, hallPrice, hallDescription, hallImage} = req.body
        const hall = await HallService.updateHall(id, hallName, hallType, hallCapacity, hallPrice, hallDescription, hallImage)
        res.status(200).json(hall)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const {id} = req.params
        await HallService.deleteHall(id)
        res.status(200).json({message: 'Hall deleted successfully'})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

module.exports = router