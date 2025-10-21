const Joi = require('joi');
const userValidation = require('./userValidation.js');

const assistantValidation = userValidation.concat(
  Joi.object({
    assignedLecturer: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).message("Invalid Lecturer ID"),
  })
);

module.exports = assistantValidation;