const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const Booking = require('../models/Booking');

dotenv.config();

async function resetSlotsAndBookings() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Make all slots available for all therapists
    console.log('\n📋 Step 1: Making all slots available...');
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} therapists`);

    let totalSlotsUpdated = 0;
    for (const employee of employees) {
      let slotsUpdated = 0;
      if (employee.availableSlots && employee.availableSlots.length > 0) {
        employee.availableSlots.forEach(slot => {
          if (slot.isBooked) {
            slot.isBooked = false;
            slotsUpdated++;
          }
        });
        // Mark the document as modified to ensure save works
        employee.markModified('availableSlots');
        await employee.save();
        totalSlotsUpdated += slotsUpdated;
        console.log(`  ✓ ${employee.name}: Updated ${slotsUpdated} slots`);
      }
    }
    
    // Verify the update worked
    console.log('\n🔍 Verifying updates...');
    const verifyEmployees = await Employee.find({});
    let verifiedBooked = 0;
    for (const emp of verifyEmployees) {
      const bookedCount = emp.availableSlots?.filter(s => s.isBooked === true).length || 0;
      if (bookedCount > 0) {
        verifiedBooked += bookedCount;
        console.log(`  ⚠️  ${emp.name} still has ${bookedCount} booked slots`);
      }
    }
    if (verifiedBooked === 0) {
      console.log('  ✅ All slots verified as available');
    } else {
      console.log(`  ⚠️  Warning: ${verifiedBooked} slots still marked as booked`);
    }
    console.log(`✅ Total slots made available: ${totalSlotsUpdated}`);

    // Step 2: Delete all bookings
    console.log('\n📋 Step 2: Deleting all bookings...');
    const bookingCount = await Booking.countDocuments();
    console.log(`Found ${bookingCount} bookings`);
    
    if (bookingCount > 0) {
      const result = await Booking.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} bookings`);
    } else {
      console.log('✅ No bookings to delete');
    }

    console.log('\n✨ Reset complete!');
    console.log(`   - ${totalSlotsUpdated} slots made available`);
    console.log(`   - ${bookingCount} bookings deleted`);

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
  resetSlotsAndBookings()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = resetSlotsAndBookings;

