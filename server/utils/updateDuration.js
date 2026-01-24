const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

dotenv.config();

async function updateDuration() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');
    console.log('\n🔄 Updating session duration to 45 minutes for all therapists...\n');

    const employees = await Employee.find({});
    console.log(`📊 Found ${employees.length} therapists\n`);

    let updated = 0;

    for (const employee of employees) {
      const oldDuration = employee.price.duration;
      const newDuration = 45;

      if (oldDuration !== newDuration) {
        employee.price.duration = newDuration;
        await employee.save();
        console.log(`✅ ${employee.name}: Updated duration from ${oldDuration} minutes to ${newDuration} minutes`);
        updated++;
      } else {
        console.log(`✓  ${employee.name}: Already at ${oldDuration} minutes (correct)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total therapists: ${employees.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`No changes needed: ${employees.length - updated}`);

    // Show final durations
    console.log('\n⏱️  FINAL SESSION DURATIONS:');
    console.log('-'.repeat(60));
    const updatedEmployees = await Employee.find({}).select('name price');
    updatedEmployees.forEach(emp => {
      console.log(`${emp.name}: ${emp.price.duration} minutes`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Duration update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating duration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateDuration();

