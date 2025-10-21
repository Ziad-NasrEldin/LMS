const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter section name"],
      trim: true,
      unique: true,
    },
    number: {
      type: Number,
      required: [true, "Please enter section number"],
      unique: true,

    },
    thumbnail: {
      type: String,
      required: [true, "Please provide a thumbnail URL"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    subSections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ECSubsection",
      },
    ],
    allowedFor: {
      type: [String],
      required: [true, "Please specify roles allowed for this section"],
      enum: [
        "Teacher",
        "Student",
        "Parent"
      ],
    },

  },
  {
    timestamps: true,
  }
);

// Virtual populate for products
sectionSchema.virtual("products", {
  ref: "ECProduct",
  localField: "_id",
  foreignField: "section",
});

sectionSchema.set("toObject", { virtuals: true });
sectionSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("ECSection", sectionSchema);
