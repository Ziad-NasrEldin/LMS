
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

const mongoose = require('mongoose');
const User = require('./userModel');

const lecturerPointsSchema = new mongoose.Schema({
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: true
  },
  points: {
    type: Number,
    default: 0
  }
}, { _id: false });

const parentSchema = new mongoose.Schema({
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  views: { type: Number, default: 0 },
  phoneNumber: { type: String, required: true },
  level: { type: String, enum: User.levels, lowercase: true },
  // Array of lecturer-specific point balances
  lecturerPoints: [lecturerPointsSchema],
  government: { type: String, required: true },
  administrationZone: { type: String, required: true },
  userSerial: {
    type: String,
    unique: true,
    index: true
  },
  profilePic: {
    type: String, // local file path
    trim: true,
  },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  successfulInvites: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Helper method to get points balance for a specific lecturer
parentSchema.methods.getLecturerPointsBalance = function (lecturerId) {
  const lecturerPointsEntry = this.lecturerPoints.find(
    entry => entry.lecturer.toString() === lecturerId.toString()
  );
  return lecturerPointsEntry ? lecturerPointsEntry.points : 0;
};

// Helper method to add points for a specific lecturer
parentSchema.methods.addLecturerPoints = function (lecturerId, pointsToAdd) {
  const lecturerPointsEntry = this.lecturerPoints.find(
    entry => entry.lecturer.toString() === lecturerId.toString()
  );

  if (lecturerPointsEntry) {
    lecturerPointsEntry.points += pointsToAdd;
  } else {
    this.lecturerPoints.push({ lecturer: lecturerId, points: pointsToAdd });
  }
};

// Helper method to use points for a specific lecturer
parentSchema.methods.useLecturerPoints = function (lecturerId, pointsToUse) {
  // Special case - if trying to deduct 0 points, always succeed
  if (pointsToUse === 0) {
    return true;
  }

  const lecturerPointsEntry = this.lecturerPoints.find(
    entry => entry.lecturer.toString() === lecturerId.toString()
  );

  if (!lecturerPointsEntry || lecturerPointsEntry.points < pointsToUse) {
    return false; // Not enough points
  }

  lecturerPointsEntry.points -= pointsToUse;
  return true; // Successfully used points
};

parentSchema.pre('save', async function (next) {
  // Auto-format phone numbers to international format for Egypt
  if (this.phoneNumber) {
    this.phoneNumber = formatEgyptianPhoneNumber(this.phoneNumber);
  }
  if (this.phoneNumber2) {
    this.phoneNumber2 = formatEgyptianPhoneNumber(this.phoneNumber2);
  }
  if (this.isNew && !this.userSerial) {
    try {
      // Get the count of existing parents to generate next number
      const count = await mongoose.model('Parent').countDocuments();
      // Generate userSerial with format PA + 3-digit number (PA001, PA002, etc.)
      this.userSerial = `PA${String(count + 1).padStart(3, '0')}`;

      // Check if this userSerial already exists (for race condition safety)
      const existingParent = await mongoose.model('Parent').findOne({ userSerial: this.userSerial });
      if (existingParent) {
        // If it exists, find the highest number and increment
        const allParents = await mongoose.model('Parent').find({}, 'userSerial').lean();
        const numbers = allParents
          .map(p => parseInt(p.userSerial.replace('PA', '')))
          .filter(n => !isNaN(n));

        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        this.userSerial = `PA${String(maxNumber + 1).padStart(3, '0')}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});


parentSchema.pre("validate", async function (next) {
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

const Parent = User.discriminator('Parent', parentSchema);

module.exports = Parent;