const mongoose = require("mongoose");
const AdministrationZonesSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
    }
);

const AdministrationZones = mongoose.model(
    "AdministrationZone",
    AdministrationZonesSchema
);
module.exports = AdministrationZones;