const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createTransporter } = require('./utils/emailService');

dotenv.config();

const app = express();

// Middleware
// CORS configuration - allow requests from Vercel frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL,
  'https://booking-employees.vercel.app', // Your Vercel frontend URL
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0 || allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Use CORS with options
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

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
  
  // Initialize email service to verify connection
  console.log('\n📧 Checking email service configuration...');
  const emailTransporter = createTransporter();
  if (emailTransporter) {
    // Connection verification happens asynchronously in createTransporter
    // The success/error message will appear shortly
  } else {
    console.warn('⚠️  Email service not configured. Emails will not be sent.');
    console.warn('   Add SMTP settings to .env file to enable email notifications.');
  }
});
