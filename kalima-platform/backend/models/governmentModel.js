const mongoose = require("mongoose");

const governmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    administrationZone: [{ type: String, required: true }]
});

module.exports = mongoose.model("Government", governmentSchema);