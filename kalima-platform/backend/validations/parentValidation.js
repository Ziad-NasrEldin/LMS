const Joi = require("joi");
const userValidation = require("./userValidation.js");
const {
  isValidEgyptianPhoneNumber,
} = require("../utils/phoneNumber.js");

const parentValidation = userValidation.concat(
  Joi.object({
    children: Joi.array(),
    views: Joi.number().integer().min(0).default(0),
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
    level: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "level must be a valid MongoDB ObjectId.",

      }),
    profession: Joi.string().trim().required(),
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
    referralSerial: Joi.string().optional(), // Allow referralSerial
  })
);

module.exports = parentValidation;
