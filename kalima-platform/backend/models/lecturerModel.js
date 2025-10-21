const mongoose = require('mongoose');
const User = require('./userModel');
const { trim } = require('lodash');

const lecturerSchema = new mongoose.Schema({
  bio: { type: String, required: true },
  expertise: { type: String, required: true },
  profilePic: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true
});

const Lecturer = User.discriminator('Lecturer', lecturerSchema);

module.exports = Lecturer;