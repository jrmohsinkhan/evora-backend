const mongoose = require('mongoose');

const DecorationServiceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    vendorId: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    price: { type: Number },
    // pricePerUnit: { type: Number },
    rating: { type: Number, default: 0 },
    numberOfReviews: { type: Number, default: 0 },
    images: [{ type: String }],
    // serviceType: { type: String }, 
    theme: { type: String },       
    // availability: { type: String }, 
}, { timestamps: true });

module.exports = mongoose.model('DecorationService', DecorationServiceSchema);
