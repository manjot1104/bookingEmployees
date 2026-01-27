const express = require('express');
const Employee = require('../models/Employee');
const router = express.Router();

// Get all employees with filters
router.get('/', async (req, res) => {
  try {
    const { center, expertise, languages, price, gender } = req.query;
    
    let query = { isActive: true };

    if (center) {
      query.center = { $regex: center, $options: 'i' };
    }

    if (gender) {
      query.gender = gender;
    }

    if (expertise) {
      query.expertise = { $in: [expertise] };
    }

    if (languages) {
      query.languages = { $in: [languages] };
    }

    if (price) {
      const priceRange = price.split('-');
      if (priceRange.length === 2) {
        query['price.amount'] = {
          $gte: parseInt(priceRange[0]),
          $lte: parseInt(priceRange[1])
        };
      }
    }

    // Optimize query: exclude availableSlots completely for list view
    // Slots are only needed when viewing individual employee profiles
    // This dramatically reduces payload size (from ~112 slots per employee to 0)
    const employees = await Employee.find(query)
      .select('-availableSlots') // Exclude slots entirely for list view
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance
    
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available slots for an employee
router.get('/:id/slots', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const availableSlots = employee.availableSlots.filter(slot => !slot.isBooked);
    res.json(availableSlots);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
