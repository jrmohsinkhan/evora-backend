const express = require('express')
const CateringService = require('../services/cateringService')

const router = express.Router()


router.post('/create', async (req, res) => {
    try{
        const {cateringName, cateringType, cateringPrice, cateringDescription, cateringImage} = req.body
        const catering = await CateringService.createCatering(cateringName, cateringType, cateringPrice, cateringDescription, cateringImage)
        res.status(201).json(catering)
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
        const catering = await CateringService.getCateringById(id)
        res.status(200).json(catering)  
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.put('/:id', async (req, res) => {
    try{
        const {id} = req.params
        const {cateringName, cateringType, cateringPrice, cateringDescription, cateringImage} = req.body
        const catering = await CateringService.updateCatering(id, cateringName, cateringType, cateringPrice, cateringDescription, cateringImage)
        res.status(200).json(catering)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const {id} = req.params
        await CateringService.deleteCatering(id)
        res.status(200).json({message: 'Catering deleted successfully'})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

module.exports = router