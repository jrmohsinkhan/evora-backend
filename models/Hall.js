const mongoose = require("mongoose");

const HallServiceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    price: { type: Number },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    capacity: { type: Number },
    menus: { type: Array },
    // timing: { type: String },
    images: [{ type: String }],
    hasParking: { type: Boolean, default: false },
    indoor: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HallService", HallServiceSchema);
