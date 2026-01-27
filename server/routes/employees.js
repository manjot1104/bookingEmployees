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

    // Optimize query: limit availableSlots to only future slots to reduce payload size
    // This significantly reduces data transfer (from ~112 slots to ~10-20 per employee)
    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance
    
    // Filter slots to only include future, available slots for the list view
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const optimizedEmployees = employees.map(emp => {
      if (emp.availableSlots && emp.availableSlots.length > 0) {
        // Only keep future, non-booked slots (max 20 for performance)
        const futureSlots = emp.availableSlots
          .filter(slot => {
            const slotDate = new Date(slot.date);
            slotDate.setHours(0, 0, 0, 0);
            return slotDate >= today && !slot.isBooked;
          })
          .slice(0, 20); // Limit to 20 slots max
        
        return {
          ...emp,
          availableSlots: futureSlots
        };
      }
      return emp;
    });
    
    res.json(optimizedEmployees);
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
