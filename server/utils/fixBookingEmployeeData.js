const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

dotenv.config();

async function fixBookingEmployeeData() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get all bookings
    const bookings = await Booking.find({});
    console.log(`📋 Found ${bookings.length} bookings to process`);

    let updated = 0;
    let errors = 0;

    for (const booking of bookings) {
      try {
        // Get employee data
        const employee = await Employee.findById(booking.employee);
        
        if (employee) {
          // Update booking with denormalized employee data
          booking.employeeName = employee.name;
          booking.employeeTitle = employee.title;
          await booking.save();
          updated++;
          console.log(`✅ Updated booking ${booking._id} with employee: ${employee.name}`);
        } else {
          console.warn(`⚠️  Employee not found for booking ${booking._id}, employee ID: ${booking.employee}`);
          // Set fallback values if not already set
          if (!booking.employeeName) {
            booking.employeeName = 'Unknown Employee';
            booking.employeeTitle = 'N/A';
            try {
              await booking.save();
              updated++;
            } catch (saveError) {
              console.error(`❌ Could not save booking ${booking._id}:`, saveError.message);
              errors++;
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing booking ${booking._id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Process complete!`);
    console.log(`   Updated: ${updated} bookings`);
    console.log(`   Errors: ${errors} bookings`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing booking employee data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixBookingEmployeeData();

