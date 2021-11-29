const { Joi, celebrate } = require('celebrate');

// Customize the default settings for Joi's validator, in a way that properties
// not defined in the validation schema don't produce any error, but are
// removed from the request
module.exports.validate = (validator, options) => celebrate(validator, { stripUnknown: true, allowUnknown: true, ...options });
// A version of the validator that doesn't remove undefined properties from the
// response. Useful for validations that only forbid certain keys (like for
// updates)
module.exports.validateWithoutStripping = (validator, options) => celebrate(validator, { allowUnknown: true, ...options });
