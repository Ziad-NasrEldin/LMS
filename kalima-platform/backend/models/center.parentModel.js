const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const parentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parent name is required.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Parent email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      // Basic email format validation (more robust validation can be added)
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address.'],
    },
    gender: {
      type: String,
      required: [true, 'Parent gender is required.'],
      enum: ['male', 'female'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
      // Don't include password in default JSON responses
      select: false,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cStudent', // Reference the 'cStudent' model you provided
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Parent phone number is required.'],
      unique: true,
      trim: true,
    },
    // createdAt and updatedAt are handled by timestamps: true
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    toJSON: { virtuals: true }, // Ensure virtuals are included in JSON output
    toObject: { virtuals: true }, // Ensure virtuals are included when converting to objects
  }
);

parentSchema.pre('save', async function (next) {

  if (!this.isModified('password')) return next();


  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass error to the next middleware/error handler
  }
});


parentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


const Parent = mongoose.model('cParent', parentSchema);

module.exports = Parent;