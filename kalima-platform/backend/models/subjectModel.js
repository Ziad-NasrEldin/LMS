const mongoose = require("mongoose");
const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter subject name"],
      trim: true,
      unique: true,
    },
    level: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Level",
      },
    ],
  },
  {
    timestamps: true,
  }
);

subjectSchema.pre("save", function (next) {
  this.level = [...new Set(this.level.map(String))];
  next();
});
module.exports = mongoose.model("Subject", subjectSchema);
