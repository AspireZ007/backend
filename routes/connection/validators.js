const Joi = require('joi');

// Define the schema for id
const idSchema = Joi.string()
	.length(24)
	.hex()
	.required()
	.messages({
		'string.base': 'ID should be a string.',
		'string.length': 'ID should be exactly 24 characters long.',
		'string.hex': 'ID should contain only hexadecimal characters.',
		'any.required': 'ID is required.'
	})

// Define the schema for signup
const connectValidator = Joi.object({
	followingId: idSchema
})

// Export the schemas
module.exports = { createValidator }