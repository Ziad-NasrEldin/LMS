const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  language: { type: String, required: true, trim: true }
}, {
  timestamps: true
});

const School = mongoose.model('School', schoolSchema);

module.exports = School;
