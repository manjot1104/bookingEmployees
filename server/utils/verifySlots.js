const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

dotenv.config();

// Valid working hours: 10:00 AM to 5:00 PM (18:00)
const validWorkingHours = [
  '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

function isValidTime(time) {
  return validWorkingHours.includes(time);
}

function isValidDay(date) {
  const dayOfWeek = date.getDay();
  // Sunday is day 0, should be excluded
  return dayOfWeek !== 0;
}

async function verifyAllSlots() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');
    console.log('\n🔍 Checking all therapist slots...\n');

    const employees = await Employee.find({});
    console.log(`📊 Total therapists: ${employees.length}\n`);

    let totalSlots = 0;
    let invalidSlots = [];
    let invalidTimeSlots = [];
    let invalidDaySlots = [];
    let validSlots = 0;

    employees.forEach((employee, empIndex) => {
      console.log(`\n${empIndex + 1}. ${employee.name} (${employee.title})`);
      console.log(`   Total slots: ${employee.availableSlots?.length || 0}`);

      if (!employee.availableSlots || employee.availableSlots.length === 0) {
        console.log('   ⚠️  No slots found');
        return;
      }

      employee.availableSlots.forEach((slot, slotIndex) => {
        totalSlots++;
        const slotDate = new Date(slot.date);
        let hasError = false;
        const errors = [];

        // Check time
        if (!isValidTime(slot.time)) {
          hasError = true;
          errors.push(`Invalid time: ${slot.time}`);
          invalidTimeSlots.push({
            employee: employee.name,
            employeeId: employee._id,
            slotIndex,
            date: slotDate,
            time: slot.time,
            type: slot.type,
            isBooked: slot.isBooked
          });
        }

        // Check day (should not be Sunday)
        if (!isValidDay(slotDate)) {
          hasError = true;
          errors.push(`Invalid day: Sunday`);
          invalidDaySlots.push({
            employee: employee.name,
            employeeId: employee._id,
            slotIndex,
            date: slotDate,
            time: slot.time,
            type: slot.type,
            isBooked: slot.isBooked
          });
        }

        if (hasError) {
          invalidSlots.push({
            employee: employee.name,
            employeeId: employee._id,
            slotIndex,
            date: slotDate.toISOString().split('T')[0],
            time: slot.time,
            type: slot.type,
            isBooked: slot.isBooked,
            errors
          });
          console.log(`   ❌ Slot ${slotIndex + 1}: ${slot.time} on ${slotDate.toISOString().split('T')[0]} - ${errors.join(', ')}`);
        } else {
          validSlots++;
        }
      });
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total therapists checked: ${employees.length}`);
    console.log(`Total slots checked: ${totalSlots}`);
    console.log(`✅ Valid slots: ${validSlots}`);
    console.log(`❌ Invalid slots: ${invalidSlots.length}`);
    console.log(`   - Invalid time slots: ${invalidTimeSlots.length}`);
    console.log(`   - Invalid day slots (Sundays): ${invalidDaySlots.length}`);

    if (invalidSlots.length > 0) {
      console.log('\n❌ INVALID SLOTS DETAILS:');
      console.log('-'.repeat(60));
      
      // Group by employee
      const slotsByEmployee = {};
      invalidSlots.forEach(slot => {
        if (!slotsByEmployee[slot.employee]) {
          slotsByEmployee[slot.employee] = [];
        }
        slotsByEmployee[slot.employee].push(slot);
      });

      Object.keys(slotsByEmployee).forEach(empName => {
        console.log(`\n${empName}:`);
        slotsByEmployee[empName].forEach(slot => {
          console.log(`  - ${slot.date} at ${slot.time} (${slot.type}) - ${slot.errors.join(', ')}`);
        });
      });

      console.log('\n⚠️  RECOMMENDATION: Run "npm run reseed" to regenerate all slots with correct timing.');
    } else {
      console.log('\n✅ All slots are valid! All slots are within 10:00 AM - 5:00 PM and exclude Sundays.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying slots:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

verifyAllSlots();

