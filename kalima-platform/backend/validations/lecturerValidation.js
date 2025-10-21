const Joi = require("joi");
const userValidation = require("./userValidation.js");

const lecturerValidation = userValidation.concat(
  Joi.object({
    subject: Joi.array().items(Joi.string().required()).required().messages({
      "array.base": "Subject must be an array",
      "array.includesRequiredUnknowns":
        "Subject must contain valid subject IDs",
    }),
    bio: Joi.string().required(),
    expertise: Joi.string().required(),
    profilePic: Joi.string().trim().allow("").optional()
  })
);

module.exports = lecturerValidation;
