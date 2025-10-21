
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
const { uniqueId } = require("lodash");
const AppError = require("../utils/appError");
const Government = require("./governmentModel");

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

const teacherSchema = new mongoose.Schema(
  {
    faction: String,
    phoneNumber: { type: String, required: true },
    subject: { type: String, required: true },
    level: [
      {
        type: String,
        enum: ["primary", "preparatory", "secondary"],
        required: true,
      },
    ],
    socialMedia: [
      {
        platform: {
          type: String,
          enum: [
            "Facebook",
            "Instagram",
            "Twitter",
            "LinkedIn",
            "TikTok",
            "YouTube",
            "WhatsApp",
            "Telegram",
          ],
          required: false,
        },
        account: {
          type: String,
          required: false,
        },
      },
    ],
    phoneNumber2: {
      type: String,
      required: false,
      trim: true,
    },
    teachesAtType: {
      type: String,
      enum: ["Center", "School", "Both"],
      required: true,
    },
    centers: [{ type: String }], // Array of strings for center names
    school: { type: String },
    lecturerPoints: [lecturerPointsSchema],
    government: { type: String, required: true },
    administrationZone: { type: String, required: true },
    userSerial: {
      type: String,
      unique: true,
      index: true,
    },
    confrimed: {
      type: Boolean,
      default: false,
    },
    confrimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
  }
);


teacherSchema.pre("save", async function (next) {
  // Auto-format phone numbers to international format for Egypt
  if (this.phoneNumber) {
    this.phoneNumber = formatEgyptianPhoneNumber(this.phoneNumber);
  }
  if (this.phoneNumber2) {
    this.phoneNumber2 = formatEgyptianPhoneNumber(this.phoneNumber2);
  }
  if (this.isNew && !this.userSerial) {
    try {
      let subjectPrefix = "";

      // If subject is an ObjectId, look up the subject name
      if (mongoose.Types.ObjectId.isValid(this.subject)) {
        const Subject = require("./subjectModel"); // Assuming you have a subject model
        const subjectDoc = await Subject.findById(this.subject);

        if (subjectDoc && subjectDoc.name) {
          // Extract first two letters from subject name
          subjectPrefix = subjectDoc.name.substring(0, 2).toUpperCase();
        } else {
          // Fallback if subject not found
          subjectPrefix = "TC"; // Teacher Code
        }
      } else {
        // If subject is a string, use first two letters
        subjectPrefix = this.subject.substring(0, 2).toUpperCase();
      }

      // Get count of existing teachers with the same subject prefix
      const existingTeachers = await mongoose
        .model("Teacher")
        .find(
          {
            userSerial: { $regex: `^${subjectPrefix}` },
          },
          "userSerial"
        )
        .lean();

      // Extract numbers and find the next available number
      const numbers = existingTeachers
        .map((t) => parseInt(t.userSerial.replace(subjectPrefix, "")))
        .filter((n) => !isNaN(n));

      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

      // Generate userSerial with format [SubjectPrefix] + 3-digit number (MA001, EN002, etc.)
      this.userSerial = `${subjectPrefix}${String(nextNumber).padStart(3, "0")}`;

      // Double-check for uniqueness (race condition safety)
      const existingWithSameSerial = await mongoose.model("Teacher").findOne({
        userSerial: this.userSerial,
      });

      if (existingWithSameSerial) {
        // If collision occurs, increment and try again
        const allTeachers = await mongoose
          .model("Teacher")
          .find({}, "userSerial")
          .lean();
        const allNumbers = allTeachers
          .filter((t) => t.userSerial.startsWith(subjectPrefix))
          .map((t) => parseInt(t.userSerial.replace(subjectPrefix, "")))
          .filter((n) => !isNaN(n));

        const maxNumber = allNumbers.length > 0 ? Math.max(...allNumbers) : 0;
        this.userSerial = `${subjectPrefix}${String(maxNumber + 1).padStart(3, "0")}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Custom validation for conditional required fields
teacherSchema.pre("validate", function (next) {
  if (
    (this.teachesAtType === "Center" || this.teachesAtType === "Both") &&
    (!this.centers || this.centers.length === 0)
  ) {
    this.invalidate(
      "centers",
      "At least one center is required if teachesAtType is 'Center' or 'Both'."
    );
  }
  if (
    (this.teachesAtType === "School" || this.teachesAtType === "Both") &&
    (!this.school || this.school.trim() === "")
  ) {
    this.invalidate(
      "school",
      "School is required if teachesAtType is 'School' or 'Both'."
    );
  }
  next();
});
teacherSchema.pre("save", function (next) {
  if (
    this.phoneNumber2 &&
    this.phoneNumber &&
    this.phoneNumber.trim() === this.phoneNumber2.trim()
  ) {
    this.invalidate(
      "phoneNumber2",
      "Phone number 2 must be different from phone number 1."
    );
    return next(
      new AppError("Phone number 2 must be different from phone number 1.", 400)
    );
  }
  next();
});
teacherSchema.pre("validate", async function (next) {
  if (this.government && this.administrationZone) {
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

teacherSchema.methods.getLecturerPointsBalance = function (lecturerId) {
  const lecturerPointsEntry = this.lecturerPoints.find(
    (entry) => entry.lecturer.toString() === lecturerId.toString()
  );
  return lecturerPointsEntry ? lecturerPointsEntry.points : 0;
};

// Helper method to add points for a specific lecturer
teacherSchema.methods.addLecturerPoints = function (lecturerId, pointsToAdd) {
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
teacherSchema.methods.useLecturerPoints = function (lecturerId, pointsToUse) {
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

const Teacher = User.discriminator("Teacher", teacherSchema);

module.exports = Teacher;
