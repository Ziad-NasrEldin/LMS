const Joi = require("joi");
const userValidation = require("./userValidation.js");
const {
  isValidEgyptianPhoneNumber,
} = require("../utils/phoneNumber.js");

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
      .required()
      .custom((value, helpers) => {
        if (!isValidEgyptianPhoneNumber(value)) {
          return helpers.error("string.pattern.base");
        }
        return value;
      })
      .messages({
        "string.pattern.base": "parentPhoneNumber must be a valid Egyptian number (+20XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX).",
      }),
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
    faction: Joi.string().optional(),
    school: Joi.string().hex().length(24).optional(),
    parent: Joi.string().hex().length(24).optional(),
    government: Joi.string().required(),
    administrationZone: Joi.string().required(),
    referralSerial: Joi.string().optional(),
  })
);

module.exports = studentValidation;
