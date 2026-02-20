const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');

dotenv.config();

function generateSundaySlots() {
  const slots = [];
  // Working hours: 10:00 AM to 6:00 PM
  const workingTimes = [
    '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];
  
  // Generate slots for next 60 days, but only for Sundays
  for (let i = 0; i < 60; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    // Only include Sundays (day 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0) {
      continue;
    }
    
    // Skip past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      continue;
    }
    
    // Generate slots for both Online and In-person
    ['Online', 'In-person'].forEach(slotType => {
      workingTimes.forEach(time => {
        slots.push({
          date: new Date(date),
          time: time,
          type: slotType,
          isBooked: false
        });
      });
    });
  }
  
  return slots;
}

async function addSundaySlots() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Adding Sunday slots to all employees...');
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees`);

    // Generate Sunday slots
    const sundaySlots = generateSundaySlots();
    console.log(`Generated ${sundaySlots.length} Sunday slots`);

    let totalSlotsAdded = 0;
    for (const employee of employees) {
      // Get existing slot dates to avoid duplicates
      const existingSlotDates = new Set();
      if (employee.availableSlots && employee.availableSlots.length > 0) {
        employee.availableSlots.forEach(slot => {
          const slotDate = new Date(slot.date);
          slotDate.setHours(0, 0, 0, 0);
          const dateKey = `${slotDate.toISOString().split('T')[0]}_${slot.time}_${slot.type}`;
          existingSlotDates.add(dateKey);
        });
      }

      // Add Sunday slots that don't already exist
      const slotsToAdd = [];
      sundaySlots.forEach(slot => {
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        const dateKey = `${slotDate.toISOString().split('T')[0]}_${slot.time}_${slot.type}`;
        
        if (!existingSlotDates.has(dateKey)) {
          slotsToAdd.push(slot);
        }
      });

      if (slotsToAdd.length > 0) {
        employee.availableSlots = [...(employee.availableSlots || []), ...slotsToAdd];
        employee.markModified('availableSlots');
        await employee.save();
        totalSlotsAdded += slotsToAdd.length;
        console.log(`  ✓ ${employee.name}: Added ${slotsToAdd.length} Sunday slots (Total: ${employee.availableSlots.length})`);
      } else {
        console.log(`  - ${employee.name}: No new Sunday slots needed (Already has ${employee.availableSlots?.length || 0} slots)`);
      }
    }

    console.log('\n✨ Sunday slots addition complete!');
    console.log(`   - Total new Sunday slots added: ${totalSlotsAdded}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  addSundaySlots()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = addSundaySlots;
