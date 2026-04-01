const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Create booking (requires authentication)
router.post('/', auth, [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('bookingDate').notEmpty().withMessage('Booking date is required'),
  body('bookingTime').notEmpty().withMessage('Booking time is required'),
  body('type').isIn(['Online', 'In-person']).withMessage('Type must be Online or In-person')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, bookingDate, bookingTime, type, notes } = req.body;

    // Get employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if slot is available
    const slot = employee.availableSlots.find(
      s => s.date.toISOString().split('T')[0] === bookingDate.split('T')[0] &&
           s.time === bookingTime &&
           s.type === type &&
           !s.isBooked
    );

    if (!slot) {
      return res.status(400).json({ message: 'Selected slot is not available' });
    }

    // Calculate price with 20% discount (always valid)
    const originalAmount = employee.price.amount;
    const discountCode = 'WELCOME20';
    const discountAmount = Math.round(originalAmount * 0.2);
    const finalAmount = originalAmount - discountAmount;

    // Create booking with denormalized employee data
    const booking = new Booking({
      user: req.user._id,
      employee: employeeId,
      employeeName: employee.name, // Store employee name directly
      employeeTitle: employee.title, // Store employee title directly
      bookingDate: new Date(bookingDate),
      bookingTime,
      type,
      price: {
        amount: finalAmount,
        currency: 'INR' // Always use INR code for Razorpay compatibility
      },
      originalAmount: originalAmount,
      discountCode: discountCode,
      discountAmount: discountAmount,
      notes,
      status: 'Pending'
    });

    await booking.save();

    // Log booking details for debugging
    console.log('✅ Booking created:', {
      bookingId: booking._id,
      price: booking.price,
      priceAmount: booking.price?.amount,
      originalAmount: booking.originalAmount,
      discountAmount: booking.discountAmount,
      discountCode: booking.discountCode
    });

    // Mark slot as booked
    slot.isBooked = true;
    await employee.save();

    // Add booking to user (use updateOne to avoid validation issues)
    await User.updateOne(
      { _id: req.user._id },
      { $push: { bookings: booking._id } }
    );
    
    // Convert booking to plain object to ensure all fields are serialized correctly
    const bookingObj = booking.toObject ? booking.toObject() : booking;

    res.status(201).json({
      message: 'Booking created successfully',
      booking: bookingObj
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookings (requires authentication)
router.get('/my-bookings', auth, async (req, res) => {
  try {
    // Get bookings without populate first to check raw employee field
    const bookingsRaw = await Booking.find({ user: req.user._id })
      .sort({ bookingDate: -1 })
      .lean(); // Use lean() to get plain objects
    
    console.log('📋 Bookings found:', bookingsRaw.length);
    
    // Process each booking and populate employee or use denormalized data
    const bookingsWithEmployee = await Promise.all(
      bookingsRaw.map(async (booking) => {
        // Check if employee field exists and is valid
        const employeeId = booking.employee;
        
        let employeeData = null;
        
        // Try to populate employee if we have a valid ID
        if (employeeId && employeeId.toString && employeeId.toString().length > 0) {
          try {
            const employee = await Employee.findById(employeeId)
              .select('name title experience price expertise languages image bio qualifications email');
            if (employee) {
              employeeData = employee;
            }
          } catch (err) {
            console.error(`❌ Error fetching employee ${employeeId} for booking ${booking._id}:`, err.message);
          }
        }
        
        // If employee not found or null, use denormalized data
        if (!employeeData) {
          if (booking.employeeName) {
            employeeData = {
              _id: employeeId || null,
              name: booking.employeeName,
              title: booking.employeeTitle || 'N/A',
              image: null
            };
          } else {
            employeeData = {
              name: 'Unknown Employee',
              title: 'N/A',
              image: null
            };
          }
        }
        
        return {
          ...booking,
          employee: employeeData
        };
      })
    );

    res.json(bookingsWithEmployee);
  } catch (error) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single booking (requires authentication)
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('employee', 'name title experience price expertise languages image')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking (requires authentication)
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update booking status
    booking.status = 'Cancelled';
    await booking.save();

    // Free up the slot
    try {
      const employee = await Employee.findById(booking.employee);
      if (employee) {
        const slot = employee.availableSlots.find(
          s => s.date.toISOString().split('T')[0] === booking.bookingDate.toISOString().split('T')[0] &&
               s.time === booking.bookingTime &&
               s.type === booking.type
        );
        
        if (slot) {
          slot.isBooked = false;
          await employee.save();
        }
      }
    } catch (slotError) {
      // Log error but don't fail the cancellation
      console.error('Error freeing up slot:', slotError);
    }

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
