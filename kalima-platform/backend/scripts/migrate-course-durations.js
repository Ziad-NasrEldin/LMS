/**
 * Migration Script: Calculate totalDuration for all existing courses
 * Run: node scripts/migrate-course-durations.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Container = require('../models/ContainerModel');
require('../models/LectureModel'); // Register Lecture model

const MONGODB_URI = process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error('Error: YOUTUBE_API_KEY not found in environment variables');
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateDurations() {
  console.log('\n=== Starting Duration Migration ===\n');
  
  try {
    // Find all containers with children
    const containers = await Container.find({ 
      children: { $exists: true, $not: { $size: 0 } } 
    });
    
    console.log(`Found ${containers.length} containers to update`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const container of containers) {
      try {
        // Check if already calculated recently (within 24 hours)
        if (container.durationCalculatedAt && 
            (Date.now() - container.durationCalculatedAt.getTime()) < 24 * 60 * 60 * 1000) {
          console.log(`⏭️  Skipped: ${container.name} (calculated recently)`);
          skipped++;
          continue;
        }
        
        // Recalculate duration
        const duration = await container.recalculateDuration();
        success++;
        
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        console.log(`✅ Updated: ${container.name} - ${formatted} (${duration} min)`);
        
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failed++;
        console.error(`❌ Failed: ${container.name} - ${error.message}`);
      }
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`✅ Success: ${success}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run migration
connectDB().then(migrateDurations);
