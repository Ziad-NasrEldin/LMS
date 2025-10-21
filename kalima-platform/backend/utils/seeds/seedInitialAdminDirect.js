const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Seeds the initial admin user directly using MongoDB driver,
 * bypassing Mongoose validation for special fields
 */
async function seedInitialAdminDirect() {
  try {
    console.log('Checking for existing admin users...');
    
    // Get the User model's collection
    const userCollection = mongoose.connection.collection('users');
    
    // Check if any admin already exists
    const adminExists = await userCollection.findOne({ role: "Admin" });
    
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
    
    // Create the admin user directly in the MongoDB collection
    // This bypasses Mongoose validation
    const result = await userCollection.insertOne({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "Admin",
      gender: process.env.INITIAL_ADMIN_GENDER || "male",
      isEmailVerified: true,
      // Set placeholder values for required fields
      // These won't be used but satisfy the schema requirements
      government: "Administrative",  
      administrationZone: "Administrative",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Initial admin created successfully with email: ${adminEmail}`);
    return result;
  } catch (error) {
    console.error('Error seeding admin user directly:', error);
    throw error;
  }
}

module.exports = seedInitialAdminDirect;
