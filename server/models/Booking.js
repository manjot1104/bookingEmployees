const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  // Denormalized employee data for performance and reliability
  employeeName: {
    type: String,
    trim: true
  },
  employeeTitle: {
    type: String,
    trim: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  bookingTime: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Online', 'In-person'],
    required: true,
    default: 'Online'
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentOrderId: {
    type: String,
    trim: true
  },
  paymentId: {
    type: String,
    trim: true
  },
  paymentSignature: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: '₹'
    }
  },
  originalAmount: {
    type: Number
  },
  discountCode: {
    type: String,
    trim: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
