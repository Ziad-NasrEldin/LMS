const mongoose = require("mongoose");
const User = require("./userModel");

const assistantSchema = new mongoose.Schema(
  {
    assignedLecturer: { type: mongoose.Schema.Types.ObjectId, ref: "Lecturer", required: true }, // Reference to Lecturer
    profilePicture: {
      url: String,
      publicId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create the Assistant model as a discriminator of the User model
const Assistant = User.discriminator("Assistant", assistantSchema);

module.exports = Assistant;