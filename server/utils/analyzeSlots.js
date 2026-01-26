const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const Booking = require('../models/Booking');

dotenv.config();

// Helper function to format date
function formatDate(date) {
  const d = new Date(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Helper function to check if date is past
function isDatePast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

// Helper function to check if date is today
function isToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
}

async function analyzeSlots() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all employees
    const employees = await Employee.find({}).sort({ name: 1 });
    console.log(`📊 Found ${employees.length} therapists\n`);
    console.log('='.repeat(80));

    // Get all bookings
    const bookings = await Booking.find({}).populate('employee', 'name');
    console.log(`\n📋 Total Bookings in Database: ${bookings.length}\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Analyze each therapist
    for (const employee of employees) {
      console.log('\n' + '='.repeat(80));
      console.log(`👤 THERAPIST: ${employee.name} (${employee.title})`);
      console.log('='.repeat(80));

      if (!employee.availableSlots || employee.availableSlots.length === 0) {
        console.log('⚠️  No slots found for this therapist');
        continue;
      }

      const totalSlots = employee.availableSlots.length;
      const bookedSlots = employee.availableSlots.filter(s => s.isBooked === true);
      const availableSlots = employee.availableSlots.filter(s => s.isBooked === false);

      console.log(`\n📊 SLOT SUMMARY:`);
      console.log(`   Total Slots: ${totalSlots}`);
      console.log(`   Available: ${availableSlots.length}`);
      console.log(`   Booked: ${bookedSlots.length}`);

      // Group slots by type
      const onlineSlots = employee.availableSlots.filter(s => s.type === 'Online');
      const inPersonSlots = employee.availableSlots.filter(s => s.type === 'In-person');
      const onlineBooked = onlineSlots.filter(s => s.isBooked);
      const inPersonBooked = inPersonSlots.filter(s => s.isBooked);

      console.log(`\n📅 BY TYPE:`);
      console.log(`   Online: ${onlineSlots.length} total (${onlineBooked.length} booked, ${onlineSlots.length - onlineBooked.length} available)`);
      console.log(`   In-person: ${inPersonSlots.length} total (${inPersonBooked.length} booked, ${inPersonSlots.length - inPersonBooked.length} available)`);

      // Find date range
      const dates = employee.availableSlots.map(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      });
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      console.log(`\n📅 DATE RANGE:`);
      console.log(`   From: ${formatDate(minDate)}`);
      console.log(`   To: ${formatDate(maxDate)}`);
      console.log(`   Days: ${Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1}`);

      // Analyze booked slots in detail
      if (bookedSlots.length > 0) {
        console.log(`\n🔴 BOOKED SLOTS DETAILS (${bookedSlots.length} total):`);
        
        // Group by date
        const bookedByDate = {};
        bookedSlots.forEach(slot => {
          const date = new Date(slot.date);
          date.setHours(0, 0, 0, 0);
          const dateKey = date.toISOString().split('T')[0];
          
          if (!bookedByDate[dateKey]) {
            bookedByDate[dateKey] = [];
          }
          bookedByDate[dateKey].push({
            time: slot.time,
            type: slot.type,
            date: date
          });
        });

        // Sort dates
        const sortedDates = Object.keys(bookedByDate).sort();
        
        let pastCount = 0;
        let todayCount = 0;
        let futureCount = 0;

        sortedDates.forEach(dateKey => {
          const date = new Date(dateKey);
          const slots = bookedByDate[dateKey];
          const dateStr = formatDate(date);
          
          let status = '';
          if (isDatePast(date)) {
            status = ' (PAST)';
            pastCount += slots.length;
          } else if (isToday(date)) {
            status = ' (TODAY)';
            todayCount += slots.length;
          } else {
            status = ' (FUTURE)';
            futureCount += slots.length;
          }

          console.log(`\n   📅 ${dateStr}${status}:`);
          slots.forEach(slot => {
            console.log(`      - ${slot.time} (${slot.type})`);
          });
        });

        console.log(`\n   📊 Booked Slots Breakdown:`);
        console.log(`      Past: ${pastCount}`);
        console.log(`      Today: ${todayCount}`);
        console.log(`      Future: ${futureCount}`);
      } else {
        console.log(`\n✅ No booked slots - All slots are available!`);
      }

      // Check for bookings in database for this employee
      const employeeBookings = bookings.filter(b => {
        const empId = b.employee?._id?.toString() || b.employee?.toString();
        return empId === employee._id.toString();
      });

      if (employeeBookings.length > 0) {
        console.log(`\n⚠️  WARNING: Found ${employeeBookings.length} booking(s) in database for this therapist:`);
        employeeBookings.forEach(booking => {
          const bookingDate = new Date(booking.bookingDate);
          console.log(`   - ${formatDate(bookingDate)} at ${booking.bookingTime} (${booking.type}) - Status: ${booking.status}, Payment: ${booking.paymentStatus}`);
        });
      }
    }

    // Overall summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 OVERALL SUMMARY');
    console.log('='.repeat(80));

    let totalAllSlots = 0;
    let totalBookedSlots = 0;
    let totalAvailableSlots = 0;

    employees.forEach(emp => {
      if (emp.availableSlots) {
        totalAllSlots += emp.availableSlots.length;
        totalBookedSlots += emp.availableSlots.filter(s => s.isBooked).length;
        totalAvailableSlots += emp.availableSlots.filter(s => !s.isBooked).length;
      }
    });

    console.log(`\nTotal Therapists: ${employees.length}`);
    console.log(`Total Slots (All Therapists): ${totalAllSlots}`);
    console.log(`Total Booked: ${totalBookedSlots}`);
    console.log(`Total Available: ${totalAvailableSlots}`);
    console.log(`Total Bookings in Database: ${bookings.length}`);

    if (totalBookedSlots > 0 && bookings.length === 0) {
      console.log(`\n⚠️  WARNING: There are ${totalBookedSlots} booked slots but 0 bookings in database!`);
      console.log(`   This suggests slots were marked as booked but bookings were deleted.`);
    }

    if (totalBookedSlots === 0 && bookings.length > 0) {
      console.log(`\n⚠️  WARNING: There are ${bookings.length} bookings in database but 0 booked slots!`);
      console.log(`   This suggests bookings exist but slots are not marked as booked.`);
    }

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
  analyzeSlots()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = analyzeSlots;

