const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Booking = require('../models/Booking');

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Delete all existing data
    await Employee.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});
    
    console.log('✅ Database cleared successfully!');
    console.log('🔄 Restart the server to seed new therapist data.');
    console.log('📋 New data includes 7 real therapists with complete profiles.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

// Run if called directly
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
  
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');
    resetDatabase().then(() => {
      mongoose.connection.close();
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}

module.exports = resetDatabase;
