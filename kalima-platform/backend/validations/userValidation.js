// A base user schema used to concat other members schemas.
const Joi = require("joi");

const userValidation = Joi.object({
  name: Joi.string().trim().required(),
  gender: Joi.string().valid("male", "female").insensitive().required(), // Please add more to not get canceled on twitter.
  email: Joi.string().required(), // Removed .email() validation to allow any email format
  address: Joi.object({
    city: Joi.string().required(),
    governorate: Joi.string().required(),
  }),
  referralSource: Joi.string().optional(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
  role: Joi.string().required(),

});

// For setting up available grades so my fingers don't work too hard.

module.exports = userValidation;
