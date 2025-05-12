const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
  },
  serviceType: {
    type: String,
    enum: ['hall', 'catering', 'car'],
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'serviceType', // Dynamically refer to the correct model
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  eventStart: {
    type: Date,
    required: true,
  },
  eventEnd: {
    type: Date,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentDetails: {
    transactionId: String,
    paymentMethod: String, // e.g., 'stripe', 'paypal', 'cash'
    paidAt: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
  otherDetails: {
    type: Object,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);