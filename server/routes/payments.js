const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendBookingConfirmation, sendAdminNotification } = require('../utils/emailService');
const { sendBookingConfirmationWhatsApp, sendAdminWhatsAppNotification } = require('../utils/whatsappService');
const router = express.Router();

const updateBookingAsPaid = async ({
  booking,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  source = 'verify-payment'
}) => {
  // Idempotency: if already paid, avoid duplicate writes/emails
  if (booking.paymentStatus === 'Paid' && booking.status === 'Confirmed') {
    return { alreadyPaid: true, booking };
  }

  booking.paymentOrderId = razorpay_order_id || booking.paymentOrderId;
  booking.paymentId = razorpay_payment_id || booking.paymentId;
  if (razorpay_signature) {
    booking.paymentSignature = razorpay_signature;
  }
  booking.status = 'Confirmed';
  booking.paymentStatus = 'Paid';
  booking.paidAt = booking.paidAt || new Date();

  // Ensure denormalized employee data is stored
  if (booking.employee && !booking.employeeName) {
    booking.employeeName = booking.employee.name;
    booking.employeeTitle = booking.employee.title;
  }

  await booking.save();

  // Populate data required for notifications
  await booking.populate('employee', 'name title experience price expertise languages image bio qualifications email');
  await booking.populate('user', 'name email phone');

  // Send confirmation notifications asynchronously
  setImmediate(async () => {
    try {
      if (!booking.user || !booking.employee) {
        console.warn(`⚠️  ${source}: Missing user/employee, skipping notifications`);
        return;
      }

      const userEmailResult = await sendBookingConfirmation(booking, booking.user, booking.employee);
      if (!userEmailResult.success) {
        console.error(`❌ ${source}: user email failed:`, userEmailResult.error);
      }

      const adminEmailResult = await sendAdminNotification(booking, booking.user, booking.employee);
      if (!adminEmailResult.success) {
        console.error(`❌ ${source}: admin email failed:`, adminEmailResult.error);
      }

      const whatsappResult = await sendBookingConfirmationWhatsApp(booking, booking.user, booking.employee);
      if (!whatsappResult.success) {
        console.error(`❌ ${source}: user WhatsApp failed:`, whatsappResult.error);
      }

      const adminWhatsappResult = await sendAdminWhatsAppNotification(booking, booking.user, booking.employee);
      if (!adminWhatsappResult.success) {
        console.error(`❌ ${source}: admin WhatsApp failed:`, adminWhatsappResult.error);
      }
    } catch (notificationError) {
      console.error(`❌ ${source}: error sending notifications`, notificationError);
    }
  });

  return { alreadyPaid: false, booking };
};

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

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
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

    // Use the booking's price (already includes discount) instead of client-provided amount
    // This ensures the correct discounted price is always used
    // Priority: booking.price.amount > booking.originalAmount (with 20% discount) > client amount
    let finalAmount;
    
    // Check if booking has price object with amount
    if (booking.price && typeof booking.price === 'object' && booking.price.amount) {
      finalAmount = booking.price.amount;
    } else if (booking.price && typeof booking.price === 'number') {
      // Handle case where price might be stored as number directly
      finalAmount = booking.price;
    } else if (booking.originalAmount) {
      // Fallback: Calculate discount from original amount
      finalAmount = Math.round(booking.originalAmount * 0.8);
      console.log('⚠️  Using calculated discount from originalAmount:', finalAmount);
    } else if (amount) {
      // Last resort: Use client amount with discount
      finalAmount = Math.round(amount * 0.8);
      console.log('⚠️  Using calculated discount from client amount:', finalAmount);
    }
    
    // Validate amount
    if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount)) {
      console.error('❌ Invalid amount for Razorpay order:', {
        bookingId: bookingId,
        priceAmount: booking.price?.amount,
        originalAmount: booking.originalAmount,
        clientAmount: amount,
        finalAmount: finalAmount
      });
      return res.status(400).json({ 
        message: 'Invalid booking amount. Please contact support.',
        details: {
          bookingPrice: booking.price?.amount,
          originalAmount: booking.originalAmount
        }
      });
    }
    
    console.log('💰 Creating Razorpay order:', {
      bookingId: bookingId,
      originalAmount: booking.originalAmount,
      discountedAmount: booking.price?.amount,
      discountCode: booking.discountCode,
      discountAmount: booking.discountAmount,
      finalAmount: finalAmount,
      amountInPaise: finalAmount * 100
    });

    // Create Razorpay order
    // Receipt must be max 40 characters
    const receiptId = `bk_${bookingId.toString().slice(-12)}_${Date.now().toString().slice(-8)}`;
    
    const options = {
      amount: finalAmount * 100, // Convert to paise (Razorpay expects amount in smallest currency unit)
      currency: 'INR', // Razorpay requires currency code, not symbol
      receipt: receiptId.substring(0, 40), // Ensure max 40 characters
      notes: {
        bookingId: bookingId.toString(),
        userId: req.user._id.toString(),
        employeeId: (booking.employee?._id || booking.employee || '').toString(),
        originalAmount: booking.originalAmount?.toString() || '',
        discountAmount: booking.discountAmount?.toString() || '',
        discountCode: booking.discountCode || ''
      }
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
      console.log('✅ Razorpay order created successfully:', order.id);
    } catch (razorpayError) {
      console.error('❌ Razorpay API error:', {
        error: razorpayError.message,
        errorDescription: razorpayError.error?.description,
        errorCode: razorpayError.error?.code,
        options: {
          amount: options.amount,
          currency: options.currency
        }
      });
      return res.status(500).json({ 
        message: 'Failed to create payment order',
        error: razorpayError.error?.description || razorpayError.message,
        details: 'Please check Razorpay configuration and try again.'
      });
    }

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
    console.error('❌ Payment order creation error:', {
      error: error.message,
      stack: error.stack,
      bookingId: req.body.bookingId
    });
    res.status(500).json({ 
      message: 'Failed to create payment order', 
      error: error.message,
      details: 'Please try again or contact support if the issue persists.'
    });
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

    const { alreadyPaid, booking: updatedBooking } = await updateBookingAsPaid({
      booking,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      source: 'verify-payment'
    });

    console.log(
      alreadyPaid
        ? 'ℹ️ Payment already marked as paid, returning current booking'
        : `✅ Payment verified. Booking confirmed for employee: ${updatedBooking.employee?.name || 'Unknown'}`
    );

    res.json({
      success: true,
      message: alreadyPaid ? 'Payment already verified' : 'Payment verified and booking confirmed',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// Razorpay webhook fallback to confirm payments even if client verification fails
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      return res.status(500).json({ message: 'Webhook secret is not configured' });
    }

    if (!signature) {
      return res.status(400).json({ message: 'Missing webhook signature' });
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      return res.status(400).json({ message: 'Missing raw request body for signature verification' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payload = req.body;
    const event = payload?.event;

    // Handle only successful payment events
    if (event !== 'payment.captured' && event !== 'order.paid') {
      return res.json({ received: true, ignored: event || 'unknown_event' });
    }

    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;
    const paymentOrderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    if (!paymentOrderId) {
      return res.status(400).json({ message: 'Missing order id in webhook payload' });
    }

    const booking = await Booking.findOne({ paymentOrderId: paymentOrderId }).populate('employee', 'name title');
    if (!booking) {
      console.warn('⚠️ Webhook booking not found for order:', paymentOrderId);
      return res.json({ received: true, bookingUpdated: false });
    }

    await updateBookingAsPaid({
      booking,
      razorpay_order_id: paymentOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      source: 'webhook'
    });

    return res.json({ received: true, bookingUpdated: true });
  } catch (error) {
    console.error('❌ Razorpay webhook error:', error);
    return res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
});

module.exports = router;
