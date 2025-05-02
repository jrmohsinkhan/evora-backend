const express = require('express')
const router = express.Router()
const CarService = require('../services/carService')

router.post('/create', async (req, res) => {
    try{
        const {carName, carType, carCapacity, carPrice, carDescription, carImage} = req.body
        const car = await CarService.createCar(carName, carType, carCapacity, carPrice, carDescription, carImage)
        res.status(201).json(car)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.get('/', async (req, res) => {
    try{
        const cars = await CarService.getAllCars()
        res.status(200).json(cars)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.get('/:id', async (req, res) => {
    try{
        const {id} = req.params
        const car = await CarService.getCarById(id)
        res.status(200).json(car)   
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.put('/:id', async (req, res) => {
    try{
        const {id} = req.params
        const {carName, carType, carCapacity, carPrice, carDescription, carImage} = req.body
        const car = await CarService.updateCar(id, carName, carType, carCapacity, carPrice, carDescription, carImage)
        res.status(200).json(car)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const {id} = req.params
        await CarService.deleteCar(id)
        res.status(200).json({message: 'Car deleted successfully'})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

module.exports = router 