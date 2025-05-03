const express = require('express')
const router = express.Router()
const CarService = require('../services/carService')
const Review = require('../models/Review')
const Vendor = require('../models/Vendor')
const mongoose = require('mongoose')

const validateCarInput = (req, res, next) => {
    const { carName, carType, carCapacity, carPrice, carDescription } = req.body
    if (!carName || !carType || !carCapacity || !carPrice) {
        return res.status(400).json({ message: 'Missing required fields' })
    }
    if (carCapacity < 1 || carPrice < 0) {
        return res.status(400).json({ message: 'Invalid capacity or price values' })
    }
    next()
}

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

router.post('/create', validateCarInput, async (req, res) => {
    try {
        const { carName, carType, carCapacity, carPrice, carDescription, carImage } = req.body
        const car = await CarService.createCar(carName, carType, carCapacity, carPrice, carDescription, carImage)
        res.status(201).json(car)
    } catch (e) {
        res.status(500).json({ message: 'Failed to create car', error: e.message })
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

router.post('/review/create', validateReviewInput, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { carId, userId, rating, comment } = req.body

        // Validate if car and user exist
        const car = await CarService.getCarById(carId)
        if (!car) {
            throw new Error('Car not found')
        }

        const review = await Review.create([{
            carId,
            userId,
            rating,
            comment,
            serviceType: 'car'
        }], { session })

        // Update car rating
        const newCarRating = calculateNewRating(car.rating, car.numberOfReviews, rating)
        car.rating = newCarRating
        car.numberOfReviews += 1
        await car.save({ session })

        // Update vendor rating
        const vendor = await Vendor.findById(car.vendorId)
        if (vendor) {
            vendor.rating = calculateNewRating(vendor.rating, vendor.numberOfReviews, rating)
            vendor.numberOfReviews += 1
            await vendor.save({ session })
        }

        await session.commitTransaction()
        res.status(201).json(review[0])
    } catch (e) {
        await session.abortTransaction()
        res.status(500).json({ 
            message: 'Failed to create review', 
            error: e.message 
        })
    } finally {
        session.endSession()
    }
})

// Helper function for rating calculation
function calculateNewRating(currentRating, numberOfReviews, newRating) {
    return ((currentRating * numberOfReviews) + newRating) / (numberOfReviews + 1)
}

router.get('/:id/reviews', async (req, res) => {
    try{
        const {id} = req.params
        const reviews = await Review.find({carId: id, serviceType: 'car'})
        res.status(200).json(reviews)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
router.get('/review/:id', async (req, res) => {
    try{
        const {id} = req.params
        const review = await Review.findById(id)
        res.status(200).json(review)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.put('/review/:id', validateReviewInput, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { id } = req.params
        const { rating, comment } = req.body

        const review = await Review.findById(id)
        if (!review) {
            throw new Error('Review not found')
        }

        const oldRating = review.rating
        review.rating = rating
        review.comment = comment
        await review.save({ session })

        const car = await CarService.getCarById(review.carId)
        if (car) {
            car.rating = ((car.rating * car.numberOfReviews) - oldRating + rating) / car.numberOfReviews
            await car.save({ session })

            const vendor = await Vendor.findById(car.vendorId)
            if (vendor) {
                vendor.rating = ((vendor.rating * vendor.numberOfReviews) - oldRating + rating) / vendor.numberOfReviews
                await vendor.save({ session })
            }
        }

        await session.commitTransaction()
        res.status(200).json(review)
    } catch (e) {
        await session.abortTransaction()
        res.status(500).json({ 
            message: 'Failed to update review', 
            error: e.message 
        })
    } finally {
        session.endSession()
    }
})

router.delete('/review/:id', async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { id } = req.params
        
        // Get the review before deleting to access its rating
        const review = await Review.findById(id)
        if (!review) {
            throw new Error('Review not found')
        }

        const oldRating = review.rating

        // Delete the review
        await Review.findByIdAndDelete(id, { session })

        // Update car rating
        const car = await CarService.getCarById(review.carId)
        if (car && car.numberOfReviews > 1) {
            car.rating = ((car.rating * car.numberOfReviews) - oldRating) / (car.numberOfReviews - 1)
            car.numberOfReviews -= 1
            await car.save({ session })

            // Update vendor rating
            const vendor = await Vendor.findById(car.vendorId)
            if (vendor && vendor.numberOfReviews > 1) {
                vendor.rating = ((vendor.rating * vendor.numberOfReviews) - oldRating) / (vendor.numberOfReviews - 1)
                vendor.numberOfReviews -= 1
                await vendor.save({ session })
            }
        }

        await session.commitTransaction()
        res.status(200).json({ message: 'Review deleted successfully' })
    } catch (e) {
        await session.abortTransaction()
        res.status(500).json({ message: e.message })
    } finally {
        session.endSession()
    }
})

module.exports = router 