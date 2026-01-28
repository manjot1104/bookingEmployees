const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const { createTransporter } = require('./utils/emailService');

dotenv.config();

const app = express();

// Enable compression for all responses (reduces payload size by ~70%)
app.use(compression());

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

// Health check - optimized for Render keep-alive
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Booking API is running',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Keep-alive endpoint to prevent Render from spinning down (free tier)
app.get('/api/ping', (req, res) => {
  res.json({ status: 'pong', timestamp: Date.now() });
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

// Optimize MongoDB connection for production
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Reduced to 10 seconds
  socketTimeoutMS: 30000, // 30 seconds
  connectTimeoutMS: 10000, // Reduced to 10 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  retryWrites: true,
  w: 'majority',
  // Keep connection alive
  keepAlive: true,
  keepAliveInitialDelay: 300000 // 5 minutes
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
