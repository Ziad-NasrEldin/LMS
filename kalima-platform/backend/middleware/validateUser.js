// Used for validating request information using JOI.
/* When adding a new role just imoprt the schema and add the role name in the "roleSchemas" variable, 
and make sure to add a new switch case to the "controllers/registerController.js". */

const teacherSchema = require("../validations/teacherValidation.js");
const studentSchema = require("../validations/studentValidation.js");
const parentSchema = require("../validations/parentValidation.js");
const lecturerSchema = require("../validations/lecturerValidation.js");
const assistantSchema = require("../validations/assistantValidation.js");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel.js");
const moderatorSchema = require("../validations/moderatorValidation.js");
const subadminSchema  = require("../validations/subAdminValidation.js");

const roleSchemas = {
  teacher: teacherSchema,
  student: studentSchema,
  parent: parentSchema,
  lecturer: lecturerSchema,
  assistant: assistantSchema,
  moderator: moderatorSchema,  
  subadmin:  subadminSchema
};

const validateUser = catchAsync(async (req, res, next) => {
  let { confirmPassword, role, password, ...updatedBody } = req.body

  if (req.method === "PATCH") {
    const user = await User.findById(req.params.userId).lean()
    if (!user) return next(new AppError("Couldn't find user.", 404));
    role = user.role
  } else {
    if (confirmPassword !== password) return res.status(400).json({ message: "Password and password confirmation don't match." });
  }

  // Check if a valid role is provided.
  if (!role || !roleSchemas[role.toLowerCase()]) {
    return res.status(400).json({ message: "Invalid or missing role" });
  }
  req.body = updatedBody
  req.body.password = password
  req.body.role = role
  req.body.confirmPassword = confirmPassword // Add confirmPassword back to the request body
  /* Depending if the request was a patch to update a user
  A copy of the schema is made with optional fields.  */


  let error;
  schema = roleSchemas[role.toLowerCase()]
  if (req.method === "PATCH") {
    // Create a partial schema where all fields are optional
    const partialSchema = schema.fork(
      Object.keys(schema.describe().keys),
      (field) => field.optional() // Make all fields optional
    );
    
    // For role field specifically, we need to handle it specially for moderator/subadmin
    if (role.toLowerCase() === 'moderator' || role.toLowerCase() === 'subadmin') {
      // Override role in the request body to ensure it matches exactly what validation expects
      req.body.role = role.toLowerCase();
    }
    
    error = partialSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Ignore fields not in the schema
    }).error;
  } else {
    error = schema.validate(req.body, { abortEarly: false }).error;
  }

  // Validate request body based on the role schema and casts it to an error if one exists.
  if (error) {
    return res.status(400).json({
      message: error.details.map((err) => err.message),
    });
  }

  next();
});

module.exports = validateUser;
