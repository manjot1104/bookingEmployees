const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    required: true
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      default: 30
    },
    currency: {
      type: String,
      default: '₹'
    }
  },
  expertise: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  center: {
    type: String,
    trim: true
  },
  availableSlots: [{
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Online', 'In-person'],
      default: 'Online'
    },
    isBooked: {
      type: Boolean,
      default: false
    }
  }],
  description: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  qualifications: {
    type: String,
    trim: true
  },
  affiliations: {
    type: String,
    trim: true
  },
  faqAnswer: {
    type: String,
    trim: true
  },
  testimonial: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Employee', employeeSchema);
