const mongoose = require('mongoose');

const CateringServiceSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String, required: true },
    area: { type: String, required: true },
    timing: { type: String, required: true },
    price: { type: String, required: true },
    cuisine: { type: String, required: true },
    image: { type: String },
    images: [{ type: String }],
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CateringService', CateringServiceSchema);