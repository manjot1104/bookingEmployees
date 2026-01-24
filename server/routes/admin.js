const express = require('express');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const User = require('../models/User');
const admin = require('../middleware/admin');
const router = express.Router();

// Get all bookings with user and employee details
router.get('/bookings', admin, async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate({
        path: 'user',
        select: 'name email phone address dateOfBirth'
      })
      .populate({
        path: 'employee',
        select: 'name title experience price expertise languages center email'
      })
      .sort({ bookingDate: -1, createdAt: -1 });

    // Ensure employee data is always available (use denormalized data if populate failed)
    const bookingsWithEmployee = bookings.map(booking => {
      const bookingObj = booking.toObject();
      
      // If employee is not populated or missing, use denormalized data or fetch it
      if (!bookingObj.employee || !bookingObj.employee.name) {
        if (bookingObj.employeeName) {
          // Use denormalized data
          bookingObj.employee = {
            _id: bookingObj.employee || bookingObj.employee?._id,
            name: bookingObj.employeeName,
            title: bookingObj.employeeTitle || 'N/A'
          };
        } else if (bookingObj.employee) {
          // Try to fetch employee if we have the ID
          console.warn(`Booking ${bookingObj._id} has employee ID but populate failed: ${bookingObj.employee}`);
        } else {
          bookingObj.employee = {
            name: 'Unknown Employee',
            title: 'N/A'
          };
        }
      }
      
      return bookingObj;
    });

    res.json({
      success: true,
      count: bookingsWithEmployee.length,
      bookings: bookingsWithEmployee
    });
  } catch (error) {
    console.error('Admin get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all employees with their slots information
router.get('/employees', admin, async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select('name title experience price expertise languages center email availableSlots isActive')
      .sort({ name: 1 });

    // Get booking counts for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        const bookings = await Booking.find({ employee: employee._id });
        const bookedSlots = employee.availableSlots.filter(slot => slot.isBooked).length;
        const totalSlots = employee.availableSlots.length;
        const availableSlots = totalSlots - bookedSlots;

        return {
          ...employee.toObject(),
          stats: {
            totalBookings: bookings.length,
            totalSlots,
            bookedSlots,
            availableSlots,
            pendingBookings: bookings.filter(b => b.status === 'Pending').length,
            confirmedBookings: bookings.filter(b => b.status === 'Confirmed').length,
            completedBookings: bookings.filter(b => b.status === 'Completed').length,
            cancelledBookings: bookings.filter(b => b.status === 'Cancelled').length
          }
        };
      })
    );

    res.json({
      success: true,
      count: employeesWithStats.length,
      employees: employeesWithStats
    });
  } catch (error) {
    console.error('Admin get employees error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', admin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate({
        path: 'bookings',
        select: 'bookingDate bookingTime status paymentStatus price',
        populate: {
          path: 'employee',
          select: 'name title'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update slot status (available/booked)
router.patch('/employees/:employeeId/slots/:slotIndex', admin, async (req, res) => {
  try {
    const { employeeId, slotIndex } = req.params;
    const { isBooked } = req.body;

    if (typeof isBooked !== 'boolean') {
      return res.status(400).json({ message: 'isBooked must be a boolean value' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const slotIdx = parseInt(slotIndex);
    if (isNaN(slotIdx) || slotIdx < 0 || slotIdx >= employee.availableSlots.length) {
      return res.status(400).json({ message: 'Invalid slot index' });
    }

    // Update slot status
    employee.availableSlots[slotIdx].isBooked = isBooked;
    await employee.save();

    res.json({
      success: true,
      message: `Slot ${isBooked ? 'marked as booked' : 'marked as available'}`,
      slot: employee.availableSlots[slotIdx]
    });
  } catch (error) {
    console.error('Admin update slot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get detailed booking information for a specific employee
router.get('/employees/:id/bookings', admin, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const bookings = await Booking.find({ employee: req.params.id })
      .populate({
        path: 'user',
        select: 'name email phone address dateOfBirth'
      })
      .sort({ bookingDate: -1 });

    res.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        title: employee.title,
        email: employee.email
      },
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Admin get employee bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard', admin, async (req, res) => {
  try {
    const [
      totalBookings,
      totalUsers,
      totalEmployees,
      bookingsByStatus,
      bookingsByType,
      recentBookings
    ] = await Promise.all([
      Booking.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Employee.countDocuments({ isActive: true }),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Booking.find({})
        .populate({
          path: 'user',
          select: 'name email',
          model: 'User'
        })
        .populate({
          path: 'employee',
          select: 'name title',
          model: 'Employee'
        })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$price.amount' } } }
    ]);

    // Ensure employee data is populated for recent bookings (use denormalized data for performance)
    const recentBookingsWithEmployee = recentBookings.map((booking) => {
      const bookingObj = booking.toObject ? booking.toObject() : booking;
      
      // If employee is not populated, use denormalized data first (faster, no DB query)
      if (!bookingObj.employee || !bookingObj.employee.name || typeof bookingObj.employee === 'string') {
        if (bookingObj.employeeName) {
          // Use denormalized data (preferred - no DB query needed)
          bookingObj.employee = {
            _id: bookingObj.employee || bookingObj.employee?._id,
            name: bookingObj.employeeName,
            title: bookingObj.employeeTitle || 'N/A'
          };
        } else {
          // Fallback to unknown if no denormalized data
          bookingObj.employee = { 
            name: 'Unknown Employee', 
            title: 'N/A' 
          };
        }
      }
      
      // Ensure user data is populated (use existing populate result)
      if (!bookingObj.user || !bookingObj.user.name) {
        bookingObj.user = {
          name: 'Unknown User',
          email: 'N/A'
        };
      }
      
      return bookingObj;
    });

    res.json({
      success: true,
      stats: {
        totalBookings,
        totalUsers,
        totalEmployees,
        totalRevenue: totalRevenue[0]?.total || 0,
        bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        bookingsByType: bookingsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      recentBookings: recentBookingsWithEmployee
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

