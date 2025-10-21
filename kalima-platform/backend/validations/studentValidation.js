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
    hobbies: Joi.array().items(Joi.string()).optional(),
    parentPhoneNumber: Joi.string().optional(),
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
