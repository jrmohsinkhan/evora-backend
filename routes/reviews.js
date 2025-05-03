// const express = require("express");
// const router = express.Router();
// const Review = require("../models/Review");
// const Vendor = require("../models/Vendor");


// const updateVendorRating = async (vendorId) => {
//     const reviews = await Review.find({ vendorId, active: true });
//     const total = reviews.reduce((sum, r) => sum + r.rating, 0);
//     const num = reviews.length;
//     const avg = num > 0 ? total / num : 0;

//     await Vendor.findByIdAndUpdate(vendorId, {
//         rating: avg,
//         numReviews: num,
//     });
// };

// router.post("/", async (req, res) => {
//     try {
//         const { vendorId, userId, rating, comment } = req.body;

//         if (!vendorId || !userId || typeof rating !== "number") {
//             return res.status(400).json({ error: "Required fields missing or invalid" });
//         }

//         const prevReview = await Review.findOne({ vendorId, userId });

//         if (prevReview && !prevReview.active) {
//             return res.status(400).json({ error: "Already submitted a review" });
//         } else if (prevReview && prevReview.active) {
//             await Review.findByIdAndUpdate(prevReview._id, { rating, comment });
//         } else {
//             await Review.create({ vendorId, userId, rating, comment, active: true });
//         }

//         await updateVendorRating(vendorId);

//         res.status(200).json({ message: "Review created or updated successfully" });
//     } catch (error) {
//         console.error("Error in POST /reviews:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// router.get("/:vendorId", async (req, res) => {
//     try {
//         const { vendorId } = req.params;
//         const reviews = await Review.find({ vendorId, active: true });
//         res.status(200).json(reviews);
//     } catch (error) {
//         console.error("Error in GET /reviews/:vendorId:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// router.put("/:reviewId", async (req, res) => {
//     try {
//         const { reviewId } = req.params;
//         const { rating, comment } = req.body;

//         if (!rating) {
//             return res.status(400).json({ error: "Rating is required" });
//         }

//         const review = await Review.findById(reviewId);
//         if (!review || !review.active) {
//             return res.status(404).json({ error: "Review not found or inactive" });
//         }

//         review.rating = rating;
//         if (comment) review.comment = comment;
//         await review.save();

//         await updateVendorRating(review.vendorId);

//         res.status(200).json(review);
//     } catch (error) {
//         console.error("Error in PUT /reviews/:reviewId:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// router.delete("/:reviewId", async (req, res) => {
//     try {
//         const { reviewId } = req.params;

//         const review = await Review.findById(reviewId);
//         if (!review || !review.active) {
//             return res.status(404).json({ error: "Review not found or already deleted" });
//         }

//         review.active = false;
//         await review.save();

//         await updateVendorRating(review.vendorId);

//         res.status(200).json({ message: "Review deleted successfully" });
//     } catch (error) {
//         console.error("Error in DELETE /reviews/:reviewId:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// module.exports = router;
