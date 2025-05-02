const mongoose = require('mongoose');

const HallServiceSchema = new mongoose.Schema({
    vendorId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    pricePerUnit: { type: Number },
    rating: { type: Number, default: 0 },
    numberOfReviews: { type: Number, default: 0 },
    images: [{ type: String }],
    capacity: { type: Number },
    hasParking: { type: Boolean },
    indoor: { type: Boolean },
}, { timestamps: true });

module.exports = mongoose.model('HallService', HallServiceSchema);
