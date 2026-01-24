const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

dotenv.config();

// Pricing configuration
const pricing = {
  'Dr. Ritu': 1200,
  'Dr. Mitali Sharma': 1200,
  // Everyone else gets 1100
  default: 1100
};

async function updatePricing() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');
    console.log('\n🔄 Updating therapist pricing...\n');

    const employees = await Employee.find({});
    console.log(`📊 Found ${employees.length} therapists\n`);

    let updated = 0;

    for (const employee of employees) {
      const newPrice = pricing[employee.name] || pricing.default;
      const oldPrice = employee.price.amount;

      if (oldPrice !== newPrice) {
        employee.price.amount = newPrice;
        await employee.save();
        console.log(`✅ ${employee.name}: Updated from ₹${oldPrice} to ₹${newPrice}`);
        updated++;
      } else {
        console.log(`✓  ${employee.name}: Already at ₹${oldPrice} (correct)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total therapists: ${employees.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`No changes needed: ${employees.length - updated}`);

    // Show final pricing
    console.log('\n💰 FINAL PRICING:');
    console.log('-'.repeat(60));
    const updatedEmployees = await Employee.find({}).select('name price');
    updatedEmployees.forEach(emp => {
      console.log(`${emp.name}: ₹${emp.price.amount}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Pricing update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating pricing:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updatePricing();

