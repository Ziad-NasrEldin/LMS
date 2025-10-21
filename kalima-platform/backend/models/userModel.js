const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  city: String,
  governorate: String,
});
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "not determined"], required: true, lowercase: true },
    email: { type: String, unique: true, required: true },
    address: addressSchema,
    referralSource: String,
    password: { type: String, required: true }, // Added password field
    passwordChangedAt: Date,
    isEmailVerified: { type: Boolean, default: false },
    //  government: {
    // type: String,
    // required: [true, 'Government is required.'],
    // enum: {
    //   values: governments,
    //   message: '"{VALUE}" is not a supported government.'
    // }
    // },
    //  administrationZone: {
    //   type: String,
    //   required: [true, 'Administration zone is required.'],
    //   enum: {
    //     values: egyptEducationalAdministrationZones,
    //     message: '"{VALUE}" is not a supported administration zone.'
    //   }
    // },
  },
  {
    discriminatorKey: "role", // Sets the name of the discriminator identifier filed.
    timestamps: true,
  },
);


// inestead of repeating hashing of passwords, we can use the pre-hook middleware
/*
userSchema.pre("save",async function (next){
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
})
*/

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
})

userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changeTimestamp;
  };
  return false;
}


const User = mongoose.model("User", userSchema);


// For setting up available grades.
//i dont think these levels will ever be used in the future but im too lazy to remove them. Xero :)

User.levels = ["grade 4", "grade 5", "grade 6", "first preparatory", "second preparatory", "third preparatory", "first secondary",
  "second secondary", "third secondary"]

userSchema.index(
  { phoneNumber2: 1 },
  {
    unique: true,
    sparse: true,
    name: 'phoneNumber2_sparse_unique'
  }
);
module.exports = User;
