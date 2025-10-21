const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Admin = require('../../models/adminModel');
const User = require('../../models/userModel');
require('dotenv').config();

/**
 * Seeds the database with an initial admin user if none exists
 */
async function seedInitialAdmin() {
  try {
    console.log('Checking for existing admin users...');
    
    // Check if any admin already exists
    const adminExists = await User.findOne({ role: "Admin" });
    
    if (adminExists) {
      console.log('Admin user already exists. Skipping admin creation.');
      return;
    }
    
    // Admin doesn't exist, create one
    console.log('No admin found. Creating initial admin user...');
      // Make sure these environment variables are set in your .env file
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const adminName = process.env.INITIAL_ADMIN_NAME || 'Super Admin';

    // Validate that required environment variables are set
    if (!adminEmail || !adminPassword) {
      console.error('Error: Required environment variables not set.');
      console.error('Please set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in your .env file');
      return;
    }
    
    // Hash the password
    const salt = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Create the admin user with all required fields
    const newAdmin = await Admin.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "Admin",
      isEmailVerified: true
    });
    
    console.log(`Initial admin created successfully with email: ${adminEmail}`);
    return newAdmin;
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    // Connect to the database if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to database...');
      await mongoose.connect(process.env.DATABASE_URI);
    }
    
    // Seed the initial admin
    await seedInitialAdmin();
    
    // Add other seeding functions here if needed
    // await seedOtherData();
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}

// Export the seeding functions
module.exports = {
  seedDatabase,
  seedInitialAdmin
};
