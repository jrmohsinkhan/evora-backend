const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Vendor = require("../models/Vendor");

router.post("/reviews", async (req, res) => {
  try {
    const { vendorId, userId, rating, comment } = req.body;

    if (!vendorId || !userId || !rating) {
      return res.status(400).json({ error: "Required fields missing" });
    }
    const prevReview = await Review.findOne({ vendorId, userId });
    if (prevReview && prevReview.active == false) {
      return res.status(400).json({ error: "Already submitted a review" });
    } else if (prevReview && prevReview.active == true) {
      await Review.findByIdAndUpdate(prevReview._id, { rating, comment });
    } else {
      await Review.create({ vendorId, userId, rating, comment, active: true });
    }
    const vendor = await Vendor.findById(vendorId);
    console.log(vendor);   
    const numOfReviews = vendor.numReviews||0;
    const prevRating = vendor.rating||0;
    vendor.rating = (numOfReviews*prevRating+ rating)/(numOfReviews+1);
    vendor.numReviews = numOfReviews+1;
    await vendor.save();
    res
      .status(200)
      .json({ message: "Review created successfully"});
  } catch (error) {
    console.error("Error in POST /reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reviews/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required" });
    }

    const reviews = await Review.find({ vendorId, active: true });
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error in GET /reviews/:vendorId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/reviews/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!reviewId || !rating) {
      return res
        .status(400)
        .json({ error: "Review ID and rating are required" });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.status(200).json(review);
  } catch (error) {
    console.error("Error in PUT /reviews/:reviewId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/reviews/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!reviewId) {
      return res.status(400).json({ error: "Review ID is required" });
    }

    const review = await Review.findByIdAndUpdate(reviewId, { active: false });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /reviews/:reviewId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
