const mongoose = require("mongoose");

const ecSubsectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Subsection must have a name"],
            trim: true,
        },
        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ECSection",
            required: [true, "Subsection must belong to a section"],
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

ecSubsectionSchema.virtual("products", {
    ref: "ECProduct",  // Updated to match the renamed model
    localField: "_id",
    foreignField: "subSection",
});

// Enable virtuals in JSON and Object outputs
ecSubsectionSchema.set("toObject", { virtuals: true });
ecSubsectionSchema.set("toJSON", { virtuals: true });

const ECSubsection = mongoose.model("ECSubsection", ecSubsectionSchema);
module.exports = ECSubsection;
