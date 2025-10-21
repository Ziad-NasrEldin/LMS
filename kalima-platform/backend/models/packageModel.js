const _ = require("lodash");
const mongoose = require("mongoose");

const pointsSchema = new mongoose.Schema(
  {
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);
const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["lecture", "month", "term", "year"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
    },
    points: {
      type: [pointsSchema],
      validate: {
        validator: function (pointsArray) {
          return (
            pointsArray.length ===
            _.uniqBy(pointsArray, (p) => p.lecturer.toString()).length
          );
        },
        message: "Each lecturer can be add once.",
      },
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Package", packageSchema);
