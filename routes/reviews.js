const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Vendor = require("../models/vendor");
const Car = require("../models/Car");
const Catering = require("../models/Catering");
const Hall = require("../models/Hall");
const Decoration = require("../models/Decoration");
const authVendor = require("../middleware/authVendor");
const authCustomer = require("../middleware/authCustomer");

function calculateNewRating(currentRating, numberOfReviews, newRating) {
  return (currentRating * numberOfReviews + newRating) / (numberOfReviews + 1);
}

function calculateUpdatedRating(
  totalRating,
  numberOfReviews,
  oldRating,
  newRating
) {
  return (
    (totalRating * numberOfReviews - oldRating + newRating) / numberOfReviews
  );
}

function calculateRemovedRating(totalRating, numberOfReviews, oldRating) {
  return (totalRating * numberOfReviews - oldRating) / (numberOfReviews - 1);
}

router.get("/vendor", authVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const reviews = await Review.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId.toString()) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          rating: 1,
          comment: 1,
          serviceType: 1,
          createdAt: 1,
          "user.name": 1,
          "user.email": 1,
          "user.profileImage": 1,
        },
      },
    ]);
    res.status(200).json(reviews);
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message });
  }
});

const serviceMap = {
  car: Car,
  catering: Catering,
  hall: Hall,
  decoration: Decoration,
};

router.post("/:type/create", authCustomer, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { type } = req.params;
    const { serviceId, rating, comment } = req.body;
    const Service = serviceMap[type];
    if (!Service) throw new Error("Invalid service type");

    const service = await Service.findById(serviceId);
    if (!service) throw new Error(`${type} not found`);

    const review = await Review.create(
      [
        {
          serviceId,
          vendorId: service.vendorId,
          userId: req.customer.id,
          rating,
          comment,
          serviceType: type,
        },
      ],
      { session }
    );

    const updateData = {
      rating: calculateNewRating(
        service.rating || 0,
        service.numberOfReviews || 0,
        rating
      ),
      numberOfReviews: (service.numberOfReviews || 0) + 1
    };
    
    await Service.findByIdAndUpdate(serviceId, updateData, { session });

    const vendor = await Vendor.findById(service.vendorId);
    if (vendor) {
      vendor.rating = calculateNewRating(
        vendor.rating || 0,
        vendor.numberOfReviews || 0,
        rating
      );
      vendor.numberOfReviews = (vendor.numberOfReviews || 0) + 1;
      await vendor.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({review: review[0], service});
  } catch (e) {
    console.log(e)
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Failed to create review", error: e.message });
  } finally {
    session.endSession();
  }
});

router.get("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const reviews = await Review.aggregate([
      { $match: { serviceId: new mongoose.Types.ObjectId(id), serviceType: type } },
      {
        $lookup: {
          from: "customers",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          "user.name": 1,
          "user.email": 1,
          "user.profileImage": 1,
        },
      },
    ]);
    res.status(200).json(reviews);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/:type/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { type, id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) throw new Error("Review not found");

    const oldRating = review.rating;
    review.rating = rating;
    review.comment = comment;
    await review.save({ session });

    const Service = serviceMap[type];
    const service = await Service.findById(review.serviceId);
    if (service) {
      service.rating = calculateUpdatedRating(
        service.rating,
        service.numberOfReviews,
        oldRating,
        rating
      );
      await service.save({ session });

      const vendor = await Vendor.findById(service.vendorId);
      if (vendor) {
        vendor.rating = calculateUpdatedRating(
          vendor.rating,
          vendor.numberOfReviews,
          oldRating,
          rating
        );
        await vendor.save({ session });
      }
    }

    await session.commitTransaction();
    res.status(200).json(review);
  } catch (e) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Failed to update review", error: e.message });
  } finally {
    session.endSession();
  }
});

router.delete("/:type/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { type, id } = req.params;
    const review = await Review.findById(id);
    if (!review) throw new Error("Review not found");

    const oldRating = review.rating;
    await Review.findByIdAndDelete(id, { session });

    const Service = serviceMap[type];
    const service = await Service.findById(review.serviceId);
    if (service && service.numberOfReviews > 1) {
      service.rating = calculateRemovedRating(
        service.rating,
        service.numberOfReviews,
        oldRating
      );
      service.numberOfReviews -= 1;
      await service.save({ session });

      const vendor = await Vendor.findById(service.vendorId);
      if (vendor && vendor.numberOfReviews > 1) {
        vendor.rating = calculateRemovedRating(
          vendor.rating,
          vendor.numberOfReviews,
          oldRating
        );
        vendor.numberOfReviews -= 1;
        await vendor.save({ session });
      }
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (e) {
    await session.abortTransaction();
    res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
