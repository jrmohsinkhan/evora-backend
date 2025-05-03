const express = require('express');
const router = express.Router()
const HallService = require('../services/hallService')
const Review = require('../models/Review')
const Vendor = require('../models/Vendor')
const mongoose = require('mongoose')

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

// Helper function for rating calculation
function calculateNewRating(currentRating, numberOfReviews, newRating) {
    return ((currentRating * numberOfReviews) + newRating) / (numberOfReviews + 1)
}

router.post('/review/create', validateReviewInput, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { hallId, userId, rating, comment } = req.body

        // Validate if hall exists
        const hall = await HallService.getHallById(hallId)
        if (!hall) {
            throw new Error('Hall not found')
        }

        const review = await Review.create([{
            hallId,
            userId,
            rating,
            comment,
            serviceType: 'hall'
        }], { session })

        // Update hall rating
        const newHallRating = calculateNewRating(hall.rating, hall.numberOfReviews, rating)
        hall.rating = newHallRating
        hall.numberOfReviews += 1
        await hall.save({ session })

        // Update vendor rating
        const vendor = await Vendor.findById(hall.vendorId)
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

router.get('/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params
        const reviews = await Review.find({ hallId: id, serviceType: 'hall' })
        res.status(200).json(reviews)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/review/:id', async (req, res) => {
    try {
        const { id } = req.params
        const review = await Review.findById(id)
        res.status(200).json(review)
    } catch (e) {
        res.status(500).json({ message: e.message })
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

        const hall = await HallService.getHallById(review.hallId)
        if (hall) {
            hall.rating = ((hall.rating * hall.numberOfReviews) - oldRating + rating) / hall.numberOfReviews
            await hall.save({ session })

            const vendor = await Vendor.findById(hall.vendorId)
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
        
        const review = await Review.findById(id)
        if (!review) {
            throw new Error('Review not found')
        }

        const oldRating = review.rating

        await Review.findByIdAndDelete(id, { session })

        const hall = await HallService.getHallById(review.hallId)
        if (hall && hall.numberOfReviews > 1) {
            hall.rating = ((hall.rating * hall.numberOfReviews) - oldRating) / (hall.numberOfReviews - 1)
            hall.numberOfReviews -= 1
            await hall.save({ session })

            const vendor = await Vendor.findById(hall.vendorId)
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