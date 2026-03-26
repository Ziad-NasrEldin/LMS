const Joi = require("joi");
const userValidation = require("./userValidation.js");
// levels = userValidation.levels

const normalizeDigitsToEnglish = (value) =>
  String(value || "")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

const sanitizeParentPhone = (value) =>
  normalizeDigitsToEnglish(value)
    .replace(/[\u200E\u200F\u061C\u202A-\u202E]/g, "")
    .replace(/[\s\-()]/g, "")
    .trim();

const isValidEgyptParentPhone = (value) =>
  /^(\+20\d{10}|0\d{10}|\d{10})$/.test(sanitizeParentPhone(value));

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
        if (!isValidEgyptParentPhone(value)) {
          return helpers.error("string.pattern.base");
        }
        return value;
      })
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
