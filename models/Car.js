const mongoose = require('mongoose');

const CarServiceSchema = new mongoose.Schema({
    vendorId: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    pricePerUnit: { type: Number },
    rating: { type: Number, default: 0 },
    numberOfReviews: { type: Number, default: 0 },
    images: [{ type: String }],
    brand: { type: String },
    model: { type: String },
    year: { type: Number },
    seats: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('CarService', CarServiceSchema);
