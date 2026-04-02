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

const buildEgyptianPhoneRule = (fieldName) =>
  Joi.string()
    .trim()
    .empty("")
    .custom((value, helpers) => {
      if (!value) return value;
      if (!isValidEgyptianPhoneNumber(value)) {
        return helpers.error("string.pattern.base");
      }
      return value;
    })
    .messages({
      "string.pattern.base": `${fieldName} must be a valid Egyptian number (+20XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX).`,
      "any.required": `${fieldName} is required for student role.`,
    });

const parentRelationRule = Joi.string()
  .trim()
  .empty("")
  .valid(...allowedParentRelations)
  .messages({
    "any.only": "parentPhoneRelation must be one of mother, father, or other.",
    "any.required": "parentPhoneRelation is required for student role.",
  });

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
    parentPhoneNumber: buildEgyptianPhoneRule("parentPhoneNumber").required(),
    parentPhoneRelation: parentRelationRule.required(),
    parentPhoneNumber2: buildEgyptianPhoneRule("parentPhoneNumber2").optional(),
    parentPhoneRelation2: parentRelationRule.when("parentPhoneNumber2", {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    hobby: Joi.string()
      .valid(...allowedHobbies)
      .required()
      .messages({
        "any.required": "hobby is required for student role.",
        "any.only": "hobby must be one of the allowed hobbies.",
      }),
    phoneNumber: buildEgyptianPhoneRule("phoneNumber").required(),
    faction: Joi.string().optional(),
    school: Joi.string().hex().length(24).optional(),
    parent: Joi.string().hex().length(24).optional(),
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
    referralSerial: Joi.string().optional(),
  })
);

module.exports = studentValidation;
