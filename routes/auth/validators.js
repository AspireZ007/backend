const Joi = require('joi');

const loginValidator = Joi.object({
	email: Joi.string().email().required()
		.messages({
			'string.email': 'Please enter a valid email address',
			'any.required': 'Please enter an email address'
		}),
	password: Joi.string().required().min(8).max(20)
		.regex(/^.*(?=.*\d)(?=.*[a-zA-Z])(?=.*[@#$%^&+=]).*$/)
		.messages({
			'any.required': 'Please enter a password',
			'string.pattern.base': 'Please enter a password containing at least one digit, one alphabet and one special character, and be between 8 to 20 characters long. '
		})
});

module.exports = { loginValidator }