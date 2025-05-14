const express = require("express");
const router = express.Router();
const Hall = require("../../models/Hall");
const Catering = require("../../models/Catering");
const Car = require("../../models/Car");
const Decoration = require("../../models/Decoration");
const authVendor = require("../../middleware/authVendor");

router.get("/", authVendor, async (req, res) => {
  try {
    const halls = await Hall.find({ vendorId: req.vendor.id });
    const caterings = await Catering.find({ vendorId: req.vendor.id });
    const cars = await Car.find({ vendorId: req.vendor.id });
    const decorations = await Decoration.find({ vendorId: req.vendor.id });
    const services = [
       halls.map((hall) => ({
        id: hall._id,
        title: hall.title,
        description: hall.description,
        price: hall.price,
        type: "hall",
        imageUris: hall.images || [hall.image],
        category: "Hall Services",
        location: hall.location,
        additionalFields: {
          Capacity: hall.capacity,
        },
      })),
     caterings.map((catering) => ({
        id: catering._id,
        title: catering.title,
        description: catering.description,
        price: catering.price,
        type: "catering",
        imageUris: catering.images || [catering.image],
        category: "Catering Services",
        location: catering.location,
        additionalFields: {
          Timing: catering.timing,
          Dishes: catering.dishes,
        },
      })),
     cars.map((car) => ({
        id: car._id,
        title: `${car.brand} ${car.model}`,
        description: car.description,
        type: "car",
        price: car.pricePerUnit,
        imageUris: car.images,
        additionalFields: {
          Location: car.location,
          Year: car.year,
          Seats: car.seats,
        },
      })),
       decorations.map((decoration) => ({
        id: decoration._id,
        title: decoration.title,
        description: decoration.description,
        type: "decoration",
        price: decoration.price,
        imageUris: decoration.images,
        location: decoration.location,
        additionalFields: {
            Theme: decoration.theme,
        },
      })),
    ];

    res
      .status(200)
      .json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
