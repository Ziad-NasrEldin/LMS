require('dotenv').config();
const mongoose = require("mongoose");
const ECSection = require("../../models/ec.sectionModel");

const sectionsData = [
  {
    name: "Designs",
    number: 1,
    thumbnail: "logo",
    description: "Design templates and resources for various projects",
    allowedFor: ["Teacher", "Student", "Parent"]
  },
  {
    name: "Courses",
    number: 2,
    thumbnail: "logo",
    description: "Educational courses and learning materials",
    allowedFor: ["Teacher", "Student", "Parent"]
  },
  {
    name: "Gifts",
    number: 3,
    thumbnail: "logo",
    description: "Gift items and special packages",
    allowedFor: ["Teacher", "Student", "Parent"]
  },
  {
    name: "Printing",
    number: 4,
    thumbnail: "logo",
    description: "Printing services and materials",
    allowedFor: ["Teacher", "Student", "Parent"]
  },
  {
    name: "Books",
    number: 5,
    thumbnail: "logo",
    description: "Educational books and publications",
    allowedFor: ["Teacher", "Student", "Parent"]
  },
  {
    name: "Software",
    number: 6,
    thumbnail: "logo",
    description: "Software tools and applications",
    allowedFor: ["Teacher", "Student", "Parent"]
  }
];

async function seedSections() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Connected to MongoDB.");
    
    console.log("Clearing existing sections...");
    await ECSection.deleteMany({});
    
    console.log("Inserting new sections...");
    await ECSection.insertMany(sectionsData);
    
    console.log("Sections seeded successfully!");
  } catch (err) {
    console.error("Error seeding sections:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
    process.exit(0);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedSections();
}

module.exports = { seedSections }; 