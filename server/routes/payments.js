const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendBookingConfirmation, sendAdminNotification } = require('../utils/emailService');
const router = express.Router();

// Initialize Razorpay
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️  Razorpay keys not configured. Payment will not work. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file');
} else {
  console.log('✅ Razorpay keys loaded successfully');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key'
});

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ message: 'Booking ID and amount are required' });
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('employee')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create Razorpay order
    // Receipt must be max 40 characters
    const receiptId = `bk_${bookingId.toString().slice(-12)}_${Date.now().toString().slice(-8)}`;
    
    const options = {
      amount: amount * 100, // Convert to paise (Razorpay expects amount in smallest currency unit)
      currency: 'INR',
      receipt: receiptId.substring(0, 40), // Ensure max 40 characters
      notes: {
        bookingId: bookingId.toString(),
        userId: req.user._id.toString(),
        employeeId: (booking.employee?._id || booking.employee || '').toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Update booking with order ID and ensure employee data is stored
    booking.paymentOrderId = order.id;
    // Ensure denormalized employee data is stored
    if (booking.employee && !booking.employeeName) {
      booking.employeeName = booking.employee.name;
      booking.employeeTitle = booking.employee.title;
    }
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag'
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
});

// Verify payment and update booking
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ message: 'All payment details are required' });
    }

    // Verify booking
    const booking = await Booking.findById(bookingId)
      .populate('employee', 'name title');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update booking with payment details
    booking.paymentOrderId = razorpay_order_id;
    booking.paymentId = razorpay_payment_id;
    booking.paymentSignature = razorpay_signature;
    booking.status = 'Confirmed';
    booking.paymentStatus = 'Paid';
    booking.paidAt = new Date();
    
    // Ensure denormalized employee data is stored (for performance and reliability)
    if (booking.employee && !booking.employeeName) {
      booking.employeeName = booking.employee.name;
      booking.employeeTitle = booking.employee.title;
    }
    
    await booking.save();

    // Populate employee and user before sending response
    await booking.populate('employee', 'name title experience price expertise languages image bio qualifications email');
    await booking.populate('user', 'name email phone');

    console.log('✅ Payment verified. Booking confirmed for employee:', booking.employee?.name || 'Unknown');

    // Send confirmation emails (non-blocking)
    try {
      if (booking.user && booking.employee) {
        // Send payment confirmation to user
        await sendBookingConfirmation(booking, booking.user, booking.employee);
        
        // Send notification to admin
        await sendAdminNotification(booking, booking.user, booking.employee);
      }
    } catch (emailError) {
      // Log error but don't fail the payment verification
      console.error('Error sending payment confirmation emails:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking: booking
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

module.exports = router;
