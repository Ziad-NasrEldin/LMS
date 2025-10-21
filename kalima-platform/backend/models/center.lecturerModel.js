const mongoose = require("mongoose");
const _ = require("lodash");

const cLecturerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  subjects: {
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    ],
    validate: {
      validator: function (subjectsArray) {
        return (
          subjectsArray.length ===
          _.uniqBy(subjectsArray, (s) => s._id.toString()).length
        );
      },
      message: "Each subject can be add once.",
    },
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
}, { timestamps: true });

const CLecturer = mongoose.models.CLecturer || mongoose.model("CLecturer", cLecturerSchema);

module.exports = CLecturer;
