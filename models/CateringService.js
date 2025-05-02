const mongoose = require('mongoose');

const CateringServiceSchema = new mongoose.Schema({
    vendorId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    pricePerUnit: { type: Number },
    rating: { type: Number, default: 0 },
    numberOfReviews: { type: Number, default: 0 },
    images: [{ type: String }],
    cuisineTypes: [{ type: String }],
    perHeadCost: { type: Number },
    includesDecor: { type: Boolean },
}, { timestamps: true });

module.exports = mongoose.model('CateringService', CateringServiceSchema);
