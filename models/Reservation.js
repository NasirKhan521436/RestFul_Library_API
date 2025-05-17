const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.ObjectId,
    ref: 'Book',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7*24*60*60*1000) // 7 days
  }
}, { timestamps: true });

reservationSchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Reservation', reservationSchema);