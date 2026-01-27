const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');

dotenv.config();

async function fixNullEmployeeBookings() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all bookings
    const allBookings = await Booking.find({});
    console.log(`📋 Total bookings in database: ${allBookings.length}\n`);

    // Find bookings with null or missing employee
    const bookingsWithNullEmployee = allBookings.filter(booking => {
      const employeeId = booking.employee;
      return !employeeId || employeeId === null || employeeId === undefined || employeeId === '';
    });

    console.log(`📋 Found ${bookingsWithNullEmployee.length} bookings with null employee\n`);

    if (bookingsWithNullEmployee.length === 0) {
      console.log('✅ No bookings with null employee found. All bookings are valid.');
      await mongoose.connection.close();
      process.exit(0);
    }

    let fixed = 0;
    let deleted = 0;

    for (const booking of bookingsWithNullEmployee) {
      console.log(`\n🔍 Processing booking: ${booking._id}`);
      console.log(`   Employee Name: ${booking.employeeName || 'N/A'}`);
      console.log(`   Employee Title: ${booking.employeeTitle || 'N/A'}`);
      console.log(`   Employee ID: ${booking.employee || 'null'}`);

      // Try to find employee by name if we have denormalized data
      if (booking.employeeName) {
        const employee = await Employee.findOne({ name: booking.employeeName });
        
        if (employee) {
          booking.employee = employee._id;
          // Ensure denormalized data is set
          if (!booking.employeeName) {
            booking.employeeName = employee.name;
          }
          if (!booking.employeeTitle) {
            booking.employeeTitle = employee.title;
          }
          await booking.save();
          console.log(`   ✅ Fixed: Linked to employee ${employee.name} (${employee._id})`);
          fixed++;
        } else {
          console.log(`   ⚠️  Employee "${booking.employeeName}" not found in database`);
          // Keep the booking with denormalized data - it's still usable
          if (!booking.employeeName) {
            booking.employeeName = 'Unknown Employee';
          }
          await booking.save();
          console.log(`   ✅ Updated: Kept booking with denormalized data`);
          fixed++;
        }
      } else {
        // No denormalized data and no employee ID - this booking is orphaned
        console.log(`   ❌ No employee data found. This booking cannot be fixed.`);
        console.log(`   💡 Options: 1) Delete this booking, 2) Manually link to an employee`);
        
        // For now, we'll keep it but mark it clearly
        booking.employeeName = booking.employeeName || 'Unknown Employee';
        booking.employeeTitle = booking.employeeTitle || 'N/A';
        await booking.save();
        fixed++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total bookings with null employee: ${bookingsWithNullEmployee.length}`);
    console.log(`Fixed/Updated: ${fixed}`);
    console.log(`Deleted: ${deleted}`);

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
  fixNullEmployeeBookings()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = fixNullEmployeeBookings;

