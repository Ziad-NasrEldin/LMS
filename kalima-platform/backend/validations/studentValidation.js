const Joi = require("joi");
const userValidation = require("./userValidation.js");
const {
  isValidEgyptianPhoneNumber,
} = require("../utils/phoneNumber.js");

const allowedHobbies = [
  "math",
  "programming",
  "languages",
  "montage",
  "designillustrating",
  "marketing",
  "other",
  "reading",
  "sports",
  "music",
  "cooking",
  "gaming",
  "art",
  "technology",
  "bicycling",
  "photography",
];

const allowedParentRelations = ["mother", "father", "other"];

const studentValidation = userValidation.concat(
  Joi.object({
    stage: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "stage must be a valid MongoDB ObjectId.",
      }),
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
    parentPhoneRelation: Joi.string()
      .trim()
      .lowercase()
      .valid(...allowedParentRelations)
      .required()
      .messages({
        "any.required": "parentPhoneRelation is required for student role.",
        "any.only": "parentPhoneRelation must be one of: mother, father, other.",
      }),
    parentPhoneNumber2: Joi.string()
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
        "string.pattern.base":
          "parentPhoneNumber2 must be a valid Egyptian number (+20XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX).",
      }),
    parentPhoneRelation2: Joi.string()
      .trim()
      .lowercase()
      .allow(null, "")
      .optional()
      .custom((value, helpers) => {
        if (value === null || value === "") {
          return value;
        }
        if (!allowedParentRelations.includes(value)) {
          return helpers.error("any.only");
        }
        return value;
      })
      .messages({
        "any.only": "parentPhoneRelation2 must be one of: mother, father, other.",
      }),
    hobby: Joi.string()
      .valid(...allowedHobbies)
      .required()
      .messages({
        "any.required": "hobby is required for student role.",
        "any.only": "hobby must be one of the allowed hobbies.",
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
