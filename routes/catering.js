const express = require('express')
const CateringService = require('../services/cateringService')
const Review = require('../models/Review')
const Vendor = require('../models/Vendor')
const mongoose = require('mongoose')

const router = express.Router()

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
        const {cateringName, cateringType, cateringPrice, cateringDescription, cateringImage} = req.body
        const catering = await CateringService.createCatering(cateringName, cateringType, cateringPrice, cateringDescription, cateringImage)
        res.status(201).json(catering)
    }catch(e){
        res.status(500).json({message: e.message})
    }
})

router.get('/', async (req, res) => {
    try{
        const caterings = await CateringService.getAllCaterings()
        res.status(200).json(caterings)
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

// Helper function for rating calculation
function calculateNewRating(currentRating, numberOfReviews, newRating) {
    return ((currentRating * numberOfReviews) + newRating) / (numberOfReviews + 1)
}

router.post('/review/create', validateReviewInput, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { cateringId, userId, rating, comment } = req.body

        // Validate if catering exists
        const catering = await CateringService.getCateringById(cateringId)
        if (!catering) {
            throw new Error('Catering not found')
        }

        const review = await Review.create([{
            cateringId,
            userId,
            rating,
            comment,
            serviceType: 'catering'
        }], { session })

        // Update catering rating
        const newCateringRating = calculateNewRating(catering.rating, catering.numberOfReviews, rating)
        catering.rating = newCateringRating
        catering.numberOfReviews += 1
        await catering.save({ session })

        // Update vendor rating
        const vendor = await Vendor.findById(catering.vendorId)
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
        const reviews = await Review.find({ cateringId: id, serviceType: 'catering' })
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

        const catering = await CateringService.getCateringById(review.cateringId)
        if (catering) {
            catering.rating = ((catering.rating * catering.numberOfReviews) - oldRating + rating) / catering.numberOfReviews
            await catering.save({ session })

            const vendor = await Vendor.findById(catering.vendorId)
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

        const catering = await CateringService.getCateringById(review.cateringId)
        if (catering && catering.numberOfReviews > 1) {
            catering.rating = ((catering.rating * catering.numberOfReviews) - oldRating) / (catering.numberOfReviews - 1)
            catering.numberOfReviews -= 1
            await catering.save({ session })

            const vendor = await Vendor.findById(catering.vendorId)
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