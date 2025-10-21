const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
}, {
  timestamps: true,
});

const Center = mongoose.model("Center", centerSchema);

module.exports = Center;