const Joi = require("joi");
const userValidation = require("./userValidation.js");

const lecturerValidation = userValidation.concat(
  Joi.object({
    subject: Joi.array().items(Joi.string().required()).required().messages({
      "array.base": "Subject must be an array",
      "array.includesRequiredUnknowns":
        "Subject must contain valid subject IDs",
    }),
    bio: Joi.string().required(),
    expertise: Joi.string().required(),
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
    profilePic: Joi.string().trim().allow("").optional()
  })
);

module.exports = lecturerValidation;
