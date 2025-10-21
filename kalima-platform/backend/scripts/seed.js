require('dotenv').config();
const mongoose = require('mongoose');
const seedInitialAdminDirect = require('../utils/seeds/seedInitialAdminDirect');

async function runSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('Connected to MongoDB');
    
    // Run the admin seeding using the direct approach that bypasses validation
    await seedInitialAdminDirect();
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
