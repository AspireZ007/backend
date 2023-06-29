const Joi = require('joi')

const courseNameSchema = Joi.string()
    .min(6)
    .max(50)
    .required()
    .regex('^[a-zA-Z0-9 ]*$')
    .message({
    'string.base': 'courseName should be a string.',
    'string.empty': 'courseName cannot be empty.',
    'string.min': 'courseName should have a minimum length of 6 characters.',
    'string.max': 'courseName should have a maximum length of 50 characters.',
    'string.pattern.base': 'courseName should only contain alphabet characters, periods and apostrophes.'
    })

const instructorNameSchema = Joi.string()
.min(2)
.max(30)
.required()
.regex(/^[a-zA-Z.'\s]*$/)
.messages({
  'string.base': 'Instructor Name should be a string.',
  'string.empty': 'Instructor Name cannot be empty.',
  'string.min': 'Instructor Name should have a minimum length of 2 characters.',
  'string.max': 'Instructor Name should have a maximum length of 3 characters.',
  'string.pattern.base': 'Instructor Name should only contain alphabet characters, periods and apostrophes.'
})

const accessSchema = Joi.number()
.min(0)
.max(1)
.required()
.messages({
    'number.base': 'Access should be a number.',
    'number.empty': 'Access cannot be empty.',
    'number.min': 'Access should have a minimum value of 0 .',
    'number.max': 'Access should have a minimum value of 1 .',
})

const countSchema = Joi.number()
  .min(0)
  .required()
  .message({
    'number.base': 'Count should be a number.',
    'number.empty': 'Count cannot be empty.',
    'number.min': 'Count should have a minimum value of 0 .',
  })

const descriptionSchema = Joi.string()
  .min(30)
  .max(500)
  .required()
  .message({
    'string.base': 'Description should be a string.',
    'string.empty': 'Description cannot be empty.',
    'string.min': 'Description should have a minimum length of 30 characters.',
    'string.max': 'Description should have a maximum length of 500 characters.',
  })

const ratingDescriptionSchema = Joi.number()
  .min(0)
  .max(5)
  .required()
  .message({
    'number.base': 'Rating should be a number.',
    'number.empty': 'Rating cannot be empty.',
    'number.min': 'Rating should have a minimum value of 0 .',
    'number.max': 'Rating should have a minimum value of 5 .',
  })

const courseValidator = Joi.object({
  courseName: courseNameSchema,
  instructorName: instructorNameSchema,
  duration: Joi.object({
    hours: countSchema,
    minutes: countSchema,
    seconds: countSchema,
  }),
  access: accessSchema,
  articlesCount: countSchema,
  assignmentsCount: countSchema,
  courseOverview: descriptionSchema,
  courseContents: Joi.array().items(descriptionSchema),
  price: countSchema,
  rating: ratingDescriptionSchema,
  image: Joi.string().required(),
  capacity: countSchema,
})

module.exports = courseValidator