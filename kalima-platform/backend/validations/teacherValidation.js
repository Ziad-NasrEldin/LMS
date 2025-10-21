const Joi = require("joi");
const userValidation = require("./userValidation.js");

const teacherValidation = userValidation.concat(
  Joi.object({
    role: Joi.string()
      .custom((value, helpers) => {
        // Case-insensitive validation for role
        if (typeof value === 'string' && value.toLowerCase() === 'teacher') {
          return 'teacher'; // Return normalized value
        }
        return helpers.error('any.only', { value });
      })
      .required()
      .messages({
        'any.only': 'Role must be "teacher"'
      }),
    faction: Joi.string().optional(),
    phoneNumber: Joi.string().required(),
    phoneNumber2: Joi.string().trim().allow(null, "").optional(),
    subject: Joi.string().required(),
    level: Joi.array()
      .items(Joi.string().valid("primary", "preparatory", "secondary"))
      .min(1)
      .required(), teachesAtType: Joi.string().valid("Center", "School", "Both").required(),
    // Make centers conditionally required but more flexible for updates
    centers: Joi.alternatives().conditional('teachesAtType', {
      is: Joi.string().valid("Center", "Both"),
      then: Joi.array().items(Joi.string()).min(1).required(),
      otherwise: Joi.array().items(Joi.string()).optional()
    }).messages({
      'any.required': 'Centers are required when teaching at a Center or Both'
    }),
    // Make school conditionally required but more flexible for updates
    school: Joi.alternatives().conditional('teachesAtType', {
      is: Joi.string().valid("School", "Both"),
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().optional()
    }).messages({
      'any.required': 'School is required when teaching at a School or Both'
    }),
    socialMedia: Joi.array()
      .items(
        Joi.object({
          platform: Joi.string()
            .valid(
              "Facebook",
              "Instagram",
              "Twitter",
              "LinkedIn",
              "TikTok",
              "YouTube",
              "WhatsApp",
              "Telegram"
            )
            .optional(),
          account: Joi.string().optional(),
        })
      )
      .optional(),
    government: Joi.string().required(),
    administrationZone: Joi.string().required(),
    referralSerial: Joi.string().allow("").optional(), // Allow referralSerial to be empty
  })
);

module.exports = teacherValidation;
