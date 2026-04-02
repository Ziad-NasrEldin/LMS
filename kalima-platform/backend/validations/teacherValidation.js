const Joi = require("joi");
const userValidation = require("./userValidation.js");
const {
  isValidEgyptianPhoneNumber,
} = require("../utils/phoneNumber.js");

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
    phoneNumber: Joi.string()
      .trim()
      .required()
      .custom((value, helpers) => {
        if (!isValidEgyptianPhoneNumber(value)) {
          return helpers.error("string.pattern.base");
        }
        return value;
      })
      .messages({
        "string.pattern.base": "phoneNumber must be a valid Egyptian number (+20XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX).",
      }),
    phoneNumber2: Joi.string()
      .trim()
      .allow(null, "")
      .optional()
      .custom((value, helpers) => {
        if (value === null || value === "") {
          return value;
        }

        if (!isValidEgyptianPhoneNumber(value)) {
          return helpers.error("string.pattern.base");
        }

        return value;
      })
      .messages({
        "string.pattern.base": "phoneNumber2 must be a valid Egyptian number (+20XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX).",
      }),
    subject: Joi.string().required(),
    level: Joi.array()
      .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
      .min(1)
      .required()
      .messages({
        "string.pattern.base": "Each teaching level must be a valid MongoDB ObjectId.",
      }),
    teachesAtType: Joi.string().valid("Center", "School", "Both").required(),
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
    government: Joi.string()
      .trim()
      .empty("")
      .required()
      .messages({
        "any.required": "Path `government` is required.",
        "string.empty": "Path `government` is required.",
      }),
    administrationZone: Joi.string()
      .trim()
      .empty("")
      .required()
      .messages({
        "any.required": "Path `administrationZone` is required.",
        "string.empty": "Path `administrationZone` is required.",
      }),
    referralSerial: Joi.string().allow("").optional(), // Allow referralSerial to be empty
  })
);

module.exports = teacherValidation;
