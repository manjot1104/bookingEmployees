const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const dotenv = require('dotenv');

dotenv.config();

// Map therapist emails to image paths
// Images should be placed in client/public/therapists/ folder
const imagePaths = {
  'kumarsunil1002452@gmail.com': '/therapists/kumarsunil1002452.jpeg',
  'prithvipadam@gmail.com': '/therapists/prithvipadam.jpeg',
  'leekha.priyanka@gmail.com': '/therapists/leekha.priyanka.jpeg',
  'vanita734722@gmail.com': '/therapists/vanita734722.jpeg',
  'lordslove89@gmail.com': '/therapists/lordslove89.jpeg',
  'mitalisharma61196@gmail.com': '/therapists/mitalisharma61196.jpeg',
  'rmudgil7198@gmail.com': '/therapists/rmudgil7198.jpeg'
};

async function updateImagePaths() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingEmployees';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');
    console.log('\n🔄 Updating therapist image paths...\n');

    const employees = await Employee.find({});
    console.log(`📊 Found ${employees.length} therapists\n`);

    let updated = 0;

    for (const employee of employees) {
      if (employee.email && imagePaths[employee.email]) {
        const newImagePath = imagePaths[employee.email];
        const oldImagePath = employee.image || '';

        if (oldImagePath !== newImagePath) {
          employee.image = newImagePath;
          await employee.save();
          console.log(`✅ ${employee.name}: Updated image path to ${newImagePath}`);
          updated++;
        } else {
          console.log(`✓  ${employee.name}: Already has image path ${newImagePath}`);
        }
      } else {
        console.log(`⚠️  ${employee.name}: No email found or no image path configured`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total therapists: ${employees.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`No changes needed: ${employees.length - updated}`);

    console.log('\n📸 IMAGE PATHS:');
    console.log('-'.repeat(60));
    console.log('Place photos in: client/public/therapists/');
    console.log('File names should match the email-based paths above.');
    console.log('\nExample:');
    console.log('  client/public/therapists/kumarsunil1002452.jpg');
    console.log('  client/public/therapists/prithvipadam.jpg');
    console.log('  etc.');

    await mongoose.connection.close();
    console.log('\n✅ Image paths update completed!');
    console.log('📝 Next step: Add photos to client/public/therapists/ folder');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating image paths:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateImagePaths();

