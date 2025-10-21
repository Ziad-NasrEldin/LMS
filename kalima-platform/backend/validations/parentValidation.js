const Joi = require("joi");
const userValidation = require("./userValidation.js");

const parentValidation = userValidation.concat(
  Joi.object({
    children: Joi.array(),
    views: Joi.number().integer().min(0).default(0),
    phoneNumber: Joi.string().required(),
    level: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "level must be a valid MongoDB ObjectId.",

      }),
    government: Joi.string().required(),
    administrationZone: Joi.string().required(),
    referralSerial: Joi.string().optional(), // Allow referralSerial
  })
);

module.exports = parentValidation;
