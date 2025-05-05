// models/Notification.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType', // Dynamic reference
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['Customer', 'Vendor'], // Adjust based on your user models
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['booking', 'review', 'system', 'custom'], // Customize types
    default: 'custom',
  },
  metadata: {
    type: Object, // e.g., { bookingId: "...", reviewId: "..." }
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
