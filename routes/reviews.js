const express = require('express')
const router = express.Router()
const Review = require('../models/Review')
const Vendor = require('../models/vendor')
const Car = require('../models/Car')
const Catering = require('../models/Catering')
const Hall = require('../models/Hall')
const Decoration = require('../models/Decoration')
const mongoose = require('mongoose')
const authVendor = require('../middleware/authVendor')

function calculateNewRating(currentRating, numberOfReviews, newRating) {
    return ((currentRating * numberOfReviews) + newRating) / (numberOfReviews + 1)
}
router.get('/vendor',authVendor, async (req, res) => {
    try {
        const vendorId = req.vendor.id
        const reviews = await Review.aggregate([
            {
                $match: { 
                    vendorId: new mongoose.Types.ObjectId(vendorId) 
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    rating: 1,
                    comment: 1,
                    serviceType: 1,
                    createdAt: 1,
                    'user.name': 1,
                    'user.email': 1,
                    'user.profileImage': 1
                }
            }
        ])
        res.status(200).json(reviews)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.post('/car/create', async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { serviceId, userId, rating, comment } = req.body

        // Validate if car exists
        const car = await Car.findById(serviceId)
        if (!car) {
            throw new Error('Car not found')
        }

        const review = await Review.create([{
            serviceId,
            vendorId: car.vendorId,
            userId,
            rating,
            comment,
            serviceType: 'car'
        }], { session })

        // Update car rating
        const newCarRating = calculateNewRating(car.rating || 0, car.numberOfReviews || 0, rating)
        car.rating = newCarRating
        car.numberOfReviews += 1
        await car.save({ session })

        // Update vendor rating
        const vendor = await Vendor.findById(car.vendorId)
        if (vendor) {
            vendor.rating = calculateNewRating(vendor.rating || 0, vendor.numberOfReviews || 0, rating)
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

router.get('/:id/car', async (req, res) => {
    try {
        const { id } = req.params
        const reviews = await Review.find({ serviceId: id, serviceType: 'car' })
        res.status(200).json(reviews)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/car/:id', async (req, res) => {
    try {
        const { id } = req.params
        const review = await Review.findById(id)
        res.status(200).json(review)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.put('/car/:id', async (req, res) => {
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

        const car = await Car.findById(review.serviceId)
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

router.delete('/car/:id', async (req, res) => {
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

        const car = await Car.findById(review.serviceId)
        if (car && car.numberOfReviews > 1) {
            car.rating = ((car.rating * car.numberOfReviews) - oldRating) / (car.numberOfReviews - 1)
            car.numberOfReviews -= 1
            await car.save({ session })

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


router.post('/catering/create', async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { serviceId, userId, rating, comment } = req.body

        // Validate if catering exists
        const catering = await Catering.findById(serviceId)
        if (!catering) {
            throw new Error('Catering not found')
        }

        const review = await Review.create([{
            serviceId,
            vendorId: catering.vendorId,
            userId,
            rating,
            comment,
            serviceType: 'catering'
        }], { session })

        // Update catering rating
        const newCateringRating = calculateNewRating(catering.rating || 0, catering.numberOfReviews || 0, rating)
        catering.rating = newCateringRating
        catering.numberOfReviews += 1
        await catering.save({ session })

        // Update vendor rating
        const vendor = await Vendor.findById(catering.vendorId)
        if (vendor) {
            vendor.rating = calculateNewRating(vendor.rating || 0, vendor.numberOfReviews || 0, rating)
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

router.get('/:id/catering', async (req, res) => {
    try {
        const { id } = req.params
        const reviews = await Review.find({ cateringId: id, serviceType: 'catering' })
        res.status(200).json(reviews)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/catering/:id', async (req, res) => {
    try {
        const { id } = req.params
        const review = await Review.findById(id)
        res.status(200).json(review)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.put('/catering/:id', async (req, res) => {
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

        const catering = await Catering.findById(review.cateringId)
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

router.delete('/catering/:id', async (req, res) => {
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

        const catering = await Catering.findById(review.cateringId)
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


router.post('/hall/create', async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { serviceId, userId, rating, comment } = req.body
        console.log(serviceId, userId, rating, comment)
        // Validate if hall exists
        const hall = await Hall.findById(serviceId)
        if (!hall) {
            throw new Error('Hall not found')
        }

        const review = await Review.create([{
            serviceId,
            vendorId: hall.vendorId,
            userId,
            rating,
            comment,
            serviceType: 'hall'
        }], { session })

        // Update hall rating
        const newHallRating = calculateNewRating(hall.rating || 0, hall.numberOfReviews || 0, rating)
        hall.rating = newHallRating
        hall.numberOfReviews += 1
        await hall.save({ session })

        // Update vendor rating
        const vendor = await Vendor.findById(hall.vendorId)
        if (vendor) {
            vendor.rating = calculateNewRating(vendor.rating || 0, vendor.numberOfReviews || 0, rating)
            vendor.numberOfReviews += 1
            await vendor.save({ session })
        }

        await session.commitTransaction()
        res.status(201).json(review[0])
    } catch (e) {
        await session.abortTransaction()
        console.log(e)
        res.status(500).json({ 
            message: 'Failed to create review', 
            error: e.message 
        })
    } finally {
        session.endSession()
    }
})

router.get('/:id/hall', async (req, res) => {
    try {
        const { id } = req.params
        const reviews = await Review.find({ hallId: id, serviceType: 'hall' })
        res.status(200).json(reviews)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/hall/:id', async (req, res) => {
    try {
        const { id } = req.params
        const review = await Review.findById(id)
        res.status(200).json(review)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.put('/hall/:id', async (req, res) => {
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

        const hall = await Hall.findById(review.hallId)
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

router.delete('/hall/:id', async (req, res) => {
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

        const hall = await Hall.findById(review.hallId)
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

router.post('/decoration/create', async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { serviceId, userId, rating, comment } = req.body

        // Validate if decoration exists
        const decoration = await Decoration.findById(serviceId)
        if (!decoration) {
            throw new Error('Decoration not found')
        }

        const review = await Review.create([{
            serviceId,
            userId,
            rating,
            comment,
            serviceType: 'decoration'
        }], { session })

        // Update decoration rating
        const newDecorationRating = calculateNewRating(decoration.rating || 0, decoration.numberOfReviews || 0, rating)
        decoration.rating = newDecorationRating
        decoration.numberOfReviews += 1
        await decoration.save({ session })

        // Update vendor rating
        const vendor = await Vendor.findById(decoration.vendorId)
        if (vendor) {
            vendor.rating = calculateNewRating(vendor.rating || 0, vendor.numberOfReviews || 0, rating)
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

router.get('/:id/decoration', async (req, res) => {
    try {
        const { id } = req.params
        const reviews = await Review.find({ decorationId: id, serviceType: 'decoration' })
        res.status(200).json(reviews)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/decoration/:id', async (req, res) => {
    try {
        const { id } = req.params
        const review = await Review.findById(id)
        res.status(200).json(review)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.put('/decoration/:id', async (req, res) => {
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

        const decoration = await Decoration.findById(review.decorationId)
        if (decoration) {
            decoration.rating = ((decoration.rating * decoration.numberOfReviews) - oldRating + rating) / decoration.numberOfReviews
            await decoration.save({ session })

            const vendor = await Vendor.findById(decoration.vendorId)
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

router.delete('/decoration/:id', async (req, res) => {
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

        const decoration = await Decoration.findById(review.decorationId)
        if (decoration && decoration.numberOfReviews > 1) {
            decoration.rating = ((decoration.rating * decoration.numberOfReviews) - oldRating) / (decoration.numberOfReviews - 1)
            decoration.numberOfReviews -= 1
            await decoration.save({ session })

            const vendor = await Vendor.findById(decoration.vendorId)
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

module.exports=router