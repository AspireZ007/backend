const Joi = require('joi')


// Define the schema for email
const emailSchema = Joi.string()
	.email()
	.required()
	.messages({
		'string.base': 'Email must be a string',
		'string.empty': 'Please enter an email address',
		'string.email': 'Please enter a valid email address',
		'any.required': 'Please enter an email address',
		'string.domain': 'Please enter a valid domain name',
		'string.uri': 'Please enter a valid URI',
		'string.regex': {
			base: 'Please enter a valid email address'
		}
	})

// Define the schema for password
const passwordSchema = Joi.string()
	.required() // repeated required to be removed
	.min(8)
	.max(20)
	.required()
	.regex(/^.*(?=.*\d)(?=.*[a-zA-Z])(?=.*[@#$%^&+=]).*$/)
	.messages({
		'string.base': 'Password should be a string.',
		'string.empty': 'Password cannot be empty.',
		'string.min': 'Password should be at least 8 characters long.',
		'string.max': 'Password should not be longer than 20 characters.',
		'string.pattern.base': 'Password should contain at least one digit, one letter (uppercase or lowercase) and one special character (@#$%^&+=).'
	})

// Define the schema for name
const nameSchema = Joi.string()
	.min(2)
	.max(30)
	.required()
	.regex(/^[a-zA-Z.'\s]*$/)
	.messages({
		'string.base': 'Name should be a string.',
		'string.empty': 'Name cannot be empty.',
		'string.min': 'Name should have a minimum length of 2 characters.',
		'string.max': 'Name should have a maximum length of 3 characters.',
		'string.pattern.base': 'Name should only contain alphabet characters, periods and apostrophes.'
	})


// Define the schema for phone
const phoneSchema = Joi.string()
	.length(10)
	.required()
	.regex(/^[6-9]\d{9}$/)
	.messages({
		'string.base': 'Phone should be a string.',
		'string.empty': 'Phone cannot be empty.',
		'string.min': 'Phone should have a minimum length of 10 characters.',
		'string.max': 'Phone should have a maximum length of 10 characters.',
		'string.pattern.base': 'Phone should be a valid Indian phone number, no special characters, just 10 digits.'
	})

// Define the schema for username
const usernameSchema = Joi.string()
	.min(3)
	.required()
	.regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
	.messages({
		'string.base': 'Username should be a string.',
		'string.empty': 'Username cannot be empty.',
		'string.min': 'Username should have a minimum length of 3 characters.',
		'string.pattern.base': 'Username should contain only alphanumeric characters and underscores, starting with an alphabet or an underscore.'
	})

// Define the schema for college
const collegeSchema = Joi.string()
	.trim()
	.min(2)
	.max(255)
	.required()
	.regex(/^[a-zA-Z0-9\s.,!?]+$/)
	.messages({
		'string.base': 'College should be a string.',
		'string.empty': 'College cannot be empty.',
		'string.min': 'College should have a minimum length of 2 characters.',
		'string.max': 'College should have a maximum length of 255 characters.',
		'string.pattern.base': 'College should only contain alphanumeric characters, punctuation, and whitespace.'
	})


const otpSchema = Joi.string()
	.required()
	.length(20)
	.regex(/^[a-zA-Z0-9]*$/)
	.messages({
		'string.base': 'OTP must be a string',
		'string.empty': 'Empty OTP',
		'string.length': 'Invalid OTP',
		'any.required': 'Empty OTP',
		'string.pattern.base': 'Invalid OTP'
	})

// Define the schema for login
const loginValidator = Joi.object({
	email: emailSchema,
	password: passwordSchema
})

// Define the schema for signup
const signupValidator = Joi.object({
	name: nameSchema,
	username: usernameSchema,
	email: emailSchema,
	college: collegeSchema,
	password: passwordSchema
})

const otpValidator = Joi.object({
	otp: otpSchema
})

const resetValidator = Joi.object({
	password: passwordSchema
})

const usernameAvailableValidator = Joi.object({
	username: usernameSchema
})

const forgotPasswordValidator = Joi.object({
	email : emailSchema
})

const resetPasswordValidator = Joi.object({
	newPassword : passwordSchema
})

// Export the schemas
module.exports = { 
	loginValidator,
	signupValidator,
	otpValidator,
	resetValidator,
	usernameAvailableValidator,
	forgotPasswordValidator, 
	resetPasswordValidator
}