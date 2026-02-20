const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');

dotenv.config();

function generateSlots(type, days) {
  const slots = [];
  // Working hours: 10:00 AM to 6:00 PM
  const workingTimes = [
    '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];
  
  let daysGenerated = 0;
  let currentDay = 0;
  
  // Generate slots for the specified number of days (including all days)
  while (daysGenerated < days) {
    const date = new Date();
    date.setDate(date.getDate() + currentDay);
    date.setHours(0, 0, 0, 0);
    
    // Include all days including Sundays
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
    
    daysGenerated++;
    currentDay++;
  }
  
  return slots;
}

async function addMoreSlots() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Adding slots for 60 days to all employees...');
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees`);

    // Generate 60 days of slots
    const newSlots = generateSlots('Online', 60);
    console.log(`Generated ${newSlots.length} new slots`);

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

      // Add new slots that don't already exist
      const slotsToAdd = [];
      newSlots.forEach(slot => {
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
        console.log(`  ✓ ${employee.name}: Added ${slotsToAdd.length} new slots (Total: ${employee.availableSlots.length})`);
      } else {
        console.log(`  - ${employee.name}: No new slots needed (Already has ${employee.availableSlots?.length || 0} slots)`);
      }
    }

    console.log('\n✨ Slots addition complete!');
    console.log(`   - Total new slots added: ${totalSlotsAdded}`);

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
  addMoreSlots()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = addMoreSlots;
