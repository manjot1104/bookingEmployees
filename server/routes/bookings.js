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
        amount: employee.price.amount,
        currency: employee.price.currency
      },
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
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'employee',
        select: 'name title experience price expertise languages image bio qualifications email',
        model: 'Employee'
      })
      .sort({ bookingDate: -1 });
    
    console.log('📋 Bookings found:', bookings.length);
    
    // Debug: Check each booking's employee data
    const bookingsWithEmployee = bookings.map((booking, index) => {
      if (!booking.employee) {
        console.error(`❌ Booking ${index + 1} (ID: ${booking._id}) has no employee populated!`);
        console.error(`   Employee ID in booking: ${booking.employee}`);
      } else {
        console.log(`✅ Booking ${index + 1}: Employee = ${booking.employee.name} (ID: ${booking.employee._id})`);
      }
      return booking;
    });

    // If any booking has missing employee, try to fetch it separately
    for (let i = 0; i < bookingsWithEmployee.length; i++) {
      const booking = bookingsWithEmployee[i];
      if (!booking.employee || !booking.employee.name) {
        console.log(`⚠️  Attempting to fetch employee for booking ${booking._id}`);
        try {
          // Get employee ID from booking (might be stored as ObjectId)
          const employeeId = booking.employee?._id || booking.employee;
          if (employeeId) {
            const employee = await Employee.findById(employeeId);
            if (employee) {
              booking.employee = employee;
              console.log(`✅ Successfully fetched employee: ${employee.name}`);
            } else {
              console.error(`❌ Employee not found with ID: ${employeeId}`);
            }
          } else {
            console.error(`❌ No employee ID found in booking ${booking._id}`);
          }
        } catch (err) {
          console.error(`❌ Error fetching employee for booking ${booking._id}:`, err.message);
        }
      }
    }

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
