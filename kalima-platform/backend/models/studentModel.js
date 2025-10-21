// Helper to convert Arabic numerals to English numerals
// Helper to format Egyptian phone numbers to international format robustly
function formatEgyptianPhoneNumber(number) {
  if (!number) return number;
  // Remove all non-digit characters except leading +
  let num = number.trim().replace(/[^\d+]/g, '');
  // Remove leading zeros (except if it's just '0')
  if (num.startsWith('00')) num = '+' + num.slice(2);
  if (num.startsWith('0') && num.length > 1) num = num.slice(1);
  // Add +20 if missing
  if (num.startsWith('+20')) return num;
  if (num.startsWith('20')) return '+' + num;
  if (num.startsWith('+')) return num; // fallback for other country codes
  // If only 10 or 11 digits, assume it's a local Egyptian number
  if (num.length === 10) return '+20' + num;
  if (num.length === 11 && num[0] === '1') return '+20' + num;
  return '+20' + num;
}

const mongoose = require("mongoose");
const User = require("./userModel");
const { required } = require("joi");
const mongooseSequence = require("mongoose-sequence")(mongoose);

const lecturerPointsSchema = new mongoose.Schema(
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

const studentSchema = new mongoose.Schema(
  {
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    hobbies: {
      required: false,
      type: [String]
    },
    parentPhoneNumber: String,
    faction: String,
    phoneNumber: { type: String, required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
    // Array of lecturer-specific point balances
    lecturerPoints: [lecturerPointsSchema],
    // General points balance
    generalPoints: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    // Flag for tracking if a promo code has been used
    hasPromoCode: {
      type: Boolean,
      default: false,
    },
    // Track if the promo code has been used for a purchase
    hasUsedPromoCode: {
      type: Boolean,
      default: false,
    },
    // Track promo code points separately
    promoPoints: {
      type: Number,
      default: 0,
    },
    government: { type: String, required: true },
    administrationZone: { type: String, required: true },
    userSerial: {
      type: String,
      unique: true,
      index: true,
    },
    profilePic: {
      type: String, // local file path
      trim: true,
    },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    successfulInvites: { type: Number, default: 0 }
  },

  {
    timestamps: true,
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  }
);
// studentSchema.virtual("purchases", {
//   ref: "Purchase",
//   localField: "_id",
//   foreignField: "student",
// });
// Helper method to get points balance for a specific lecturer
studentSchema.methods.getLecturerPointsBalance = function (lecturerId) {
  const lecturerPointsEntry = this.lecturerPoints.find(
    (entry) => entry.lecturer.toString() === lecturerId.toString()
  );
  return lecturerPointsEntry ? lecturerPointsEntry.points : 0;
};

// Helper method to add points for a specific lecturer
studentSchema.methods.addLecturerPoints = function (lecturerId, pointsToAdd) {
  const lecturerPointsEntry = this.lecturerPoints.find(
    (entry) => entry.lecturer.toString() === lecturerId.toString()
  );

  if (lecturerPointsEntry) {
    lecturerPointsEntry.points += pointsToAdd;
  } else {
    this.lecturerPoints.push({ lecturer: lecturerId, points: pointsToAdd });
  }
};

// Helper method to use points for a specific lecturer
studentSchema.methods.useLecturerPoints = function (lecturerId, pointsToUse) {
  // Special case - if trying to deduct 0 points, always succeed
  if (pointsToUse === 0) {
    return true;
  }

  const lecturerPointsEntry = this.lecturerPoints.find(
    (entry) => entry.lecturer.toString() === lecturerId.toString()
  );

  if (!lecturerPointsEntry || lecturerPointsEntry.points < pointsToUse) {
    return false; // Not enough points
  }

  lecturerPointsEntry.points -= pointsToUse;
  return true; // Successfully used points
};

studentSchema.pre("save", async function (next) {
  // Auto-format phone numbers to international format for Egypt
  if (this.phoneNumber) {
    this.phoneNumber = formatEgyptianPhoneNumber(this.phoneNumber);
  }
  if (this.phoneNumber2) {
    this.phoneNumber2 = formatEgyptianPhoneNumber(this.phoneNumber2);
  }
  if (this.isNew && !this.userSerial) {
    try {
      // Get the count of existing students to generate next number
      const count = await mongoose.model("Student").countDocuments();
      // Generate userSerial with format ST + 3-digit number (ST001, ST002, etc.)
      this.userSerial = `ST${String(count + 1).padStart(3, "0")}`;

      // Check if this userSerial already exists (for race condition safety)
      const existingStudent = await mongoose
        .model("Student")
        .findOne({ userSerial: this.userSerial });
      if (existingStudent) {
        // If it exists, find the highest number and increment
        const allStudents = await mongoose
          .model("Student")
          .find({}, "userSerial")
          .lean();
        const numbers = allStudents
          .map((s) => parseInt(s.userSerial.replace("ST", "")))
          .filter((n) => !isNaN(n));

        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        this.userSerial = `ST${String(maxNumber + 1).padStart(3, "0")}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-validate hook to ensure the selected zone belongs to the selected government
studentSchema.pre("validate", async function (next) {
  if (this.government && this.zone) {
    const Government = require("./governmentModel");
    const gov = await Government.findOne({ name: this.government });
    if (!gov) {
      this.invalidate("government", "Selected government does not exist.");
    } else if (!gov.administrationZone.includes(this.administrationZone)) {
      this.invalidate(
        "zone",
        "Selected zone does not belong to the selected government."
      );
    }
  }
  next();
});

// A plugin to easily increment a field.
studentSchema.plugin(mongooseSequence, {
  inc_field: "sequencedId",
  startAt: 1000000,
});

const Student = User.discriminator("Student", studentSchema);

module.exports = Student;
