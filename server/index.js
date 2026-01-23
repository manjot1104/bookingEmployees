const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Booking API is running' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';

// Set mongoose to not buffer commands if not connected
mongoose.set('bufferCommands', false);

console.log('🔄 Attempting to connect to MongoDB...');
if (MONGODB_URI.includes('mongodb+srv://')) {
  console.log('📍 Using MongoDB Atlas (Cloud)');
} else {
  console.log('📍 Using Local MongoDB');
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 30000, // 30 seconds
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  // Seed dummy data if database is empty
  require('./utils/seedData')();
})
.catch((err) => {
  console.error('\n❌ MongoDB connection error:', err.message);
  console.error('\n📋 Troubleshooting steps:');
  if (MONGODB_URI.includes('mongodb+srv://')) {
    console.error('1. ✅ Check if your IP is whitelisted in MongoDB Atlas');
    console.error('2. ✅ Go to: https://cloud.mongodb.com/ → Security → Network Access');
    console.error('3. ✅ Click "Add IP Address" → "Add Current IP Address"');
    console.error('4. ✅ Wait 1-2 minutes and restart the server');
    console.error('\n💡 Quick fix: Add 0.0.0.0/0 to allow all IPs (for testing only)');
  } else {
    console.error('1. ✅ Make sure MongoDB is installed and running locally');
    console.error('2. ✅ Check if MongoDB service is started');
    console.error('3. ✅ Verify connection string is correct');
  }
  console.error('\n⚠️  Server will continue but database operations will fail until connection is established.');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
