const Joi = require("joi");
const userValidation = require("./userValidation.js");
// levels = userValidation.levels

const studentValidation = userValidation.concat(
  Joi.object({
    level: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "level must be a valid MongoDB ObjectId.",
      }),
    parentPhoneNumber: Joi.string()
      .trim()
      .pattern(/^(\+20\d{10}|0\d{10}|\d{10})$/)
      .required()
      .messages({
        "string.pattern.base": "parentPhoneNumber must be a valid Egyptian number (+20XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX).",
      }),
    phoneNumber: Joi.string().required(),
    faction: Joi.string().optional(),
    school: Joi.string().hex().length(24).optional(),
    parent: Joi.string().hex().length(24).optional(),
    government: Joi.string().required(),
    administrationZone: Joi.string().required(),
    referralSerial: Joi.string().optional(), // Allow referralSerial
  })
);

module.exports = studentValidation;
