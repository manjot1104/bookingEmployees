const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const adminUsers = [
  { email: 'nonavi080@gmail.com', password: 'Nonavi@080', name: 'Navdeep Singh' },
  { email: 'manjot1104@gmail.com', password: 'waheguru', name: 'Manjot Singh' },
  { email: 'ravisharora007@gmail.com', password: 'Ravish123', name: 'Ravish Arora' },
  { email: 'kartikks3367@gmail.com', password: 'Sbi@1234', name: 'Karthik Sharma' }
];

async function setAdminUsers() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    for (const adminUser of adminUsers) {
      const user = await User.findOne({ email: adminUser.email });
      
      if (user) {
        // Update existing user to admin with correct name
        user.role = 'admin';
        user.name = adminUser.name;
        await user.save();
        console.log(`✅ Updated ${adminUser.email} to admin with name: ${adminUser.name}`);
      } else {
        // Create new admin user with correct name
        const newUser = new User({
          name: adminUser.name,
          email: adminUser.email,
          password: adminUser.password,
          role: 'admin'
        });
        await newUser.save();
        console.log(`✅ Created admin user: ${adminUser.email} with name: ${adminUser.name}`);
      }
    }

    console.log('✅ All admin users set successfully');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin users:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

setAdminUsers();

