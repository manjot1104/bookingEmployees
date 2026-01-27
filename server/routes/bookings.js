const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendBookingConfirmation, sendAdminNotification } = require('../utils/emailService');
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

    // Check if user is new (has no previous bookings)
    const previousBookings = await Booking.countDocuments({ 
      user: req.user._id,
      status: { $ne: 'Cancelled' }
    });
    const isNewUser = previousBookings === 0;

    // Calculate price with discount for new users
    const originalAmount = employee.price.amount;
    let finalAmount = originalAmount;
    let discountCode = null;
    let discountAmount = 0;

    if (isNewUser) {
      // Apply 20% discount for new users on first session
      discountCode = 'WELCOME20';
      discountAmount = Math.round(originalAmount * 0.2);
      finalAmount = originalAmount - discountAmount;
    }

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
        currency: employee.price.currency
      },
      originalAmount: isNewUser ? originalAmount : undefined,
      discountCode: discountCode,
      discountAmount: discountAmount,
      notes,
      status: 'Pending'
    });

    await booking.save();

    // Mark slot as booked
    slot.isBooked = true;
    await employee.save();

    // Add booking to user
    const user = await User.findById(req.user._id);
    user.bookings.push(booking._id);
    await user.save();

    // Populate employee details
    await booking.populate('employee', 'name title experience price expertise languages');

    // Send email notifications (non-blocking)
    try {
      // Send confirmation email to user
      await sendBookingConfirmation(booking, user, employee);
      
      // Send notification to admin
      await sendAdminNotification(booking, user, employee);
    } catch (emailError) {
      // Log error but don't fail the booking creation
      console.error('Error sending booking emails:', emailError);
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking
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
