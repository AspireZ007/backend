// External Import

const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")
const express = require('express')
const jwt = require("jsonwebtoken")

// Helpers
const { sendVerificationEmail, getRandomString } = require('../../helpers/email')
const { checkIfUserExists } = require('../../helpers/db')
const { hashPassword } = require('../../helpers/password')

// Logger
const logger = require('../../helpers/logger')

// Database
const User = require('../../db/models/user/model')

const { loginValidator, signupValidator } = require('./validators')
const { generateResponseMessage } = require('../../helpers/response')

// Constants

const { USERSTATUS_CODES } = require("../../db/models/user/model")

// Instantiating the router object
const router = express.Router()

// TODO: finish these routes
// router.post('/forgotPassword', authController.forgotPassword)
// router.put('/resetPassword/:token', authController.resetPassword)
// router.post('/usernameAvailable', authController.isUsernameAvailable)

/**
 * Route to handle user authentication and generate a JSON web token.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
router.post("/login", async (req, res) => {

	// validate the request body
	const { error } = loginValidator.validate(req.body) // validate the request body
	if (error)
		return res.status(400).send(error.details[0].message) // send a clear error message if validation fails

	try {
		// search for the user in the database
		const { email, password } = req.body
		const user = await User.findOne({ email },
			{
				_id: 1, firstname: 1, lastname: 1, email: 1,
				status: 1, role: 1, password: 1, username: 1
			})

		// if user not found, send an error message
		if (!user) {
			return res.status(400).json({ message: 'Invalid Credentials' })
		}

		// Compare user-entered password with hashed password stored in database
		const match = await bcrypt.compare(password, user.password)
		if (!match) {
			return res.status(400).json({ message: 'Invalid Credentials' })
		}

		// Check the current status of the user
		if (!user.status != USERSTATUS_CODES.PERMANENT) {
			return res.status(400).json({ message: 'Invalid Credentials' })
		}

		const tokenPayload = {
			...user.toObject(),
			loginTime: new Date().toString()
		}
		delete tokenPayload.password
		delete tokenPayload.status

		const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
			expiresIn: '1h'
		})
		res.json({ token })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Server Error' })
	}
})


/**
 * Route to handle user sign up requests
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
router.post("/signup", async (req, res) => {

	// validate the request body
	const { error } = signupValidator.validate(req.body) // validate the request body

	// If there's an error with the validation, send a 400 Bad Request status code and the error message
	if (error)
		return res.status(400).json(generateResponseMessage("error", error.details[0].message))

	const { firstname, lastname, email, password, phone, username, college } = req.body

	try {
		// Check if user already exists. If so, return the appropriate error response.
		const userExistsStatus = await checkIfUserExists(email, username)
		switch (userExistsStatus) {
			case -1:
				// -1 if an error occurs during the database query
				return res.status(500).json(generateResponseMessage("error", "unable to contact the database temporarily"))
			case -2:
				// -1 if an error occurs during the database query
				return res.status(500).json(generateResponseMessage("error", "database constraint broken!"))

			case 1:
				// found user's status is PERMANENT, already registered
				return res.status(409).json(generateResponseMessage("error", `user already exists with email ${email}`))
			case 2:
				// found user's status is TEMPORARY, unregistered
				return res.status(412).json(generateResponseMessage("error", `user already exists with email ${email}, but needs to finish registration`))
			case 3:
				// found user's status is BANNED
				return res.status(401).json(generateResponseMessage("error", `user banned: ${email}`))
			case 4:
				// username already taken
				return res.status(422).json(generateResponseMessage("error", `username ${username} already taken`))
		}
	} catch (err) {
		// If any error occurs when checking if user exists, return a 500 Internal Server Error status code
		logger.error(err)
		return res.status(500).json(generateResponseMessage("error", err))
	}

	try {
		const randomString = getRandomString()
		const hashedPassword = await hashPassword(password)

		// Create a new User object with the validated form data and hashed password
		const newUserObject = { firstname, lastname, email, password: hashedPassword, phone, username, college, otp: randomString }

		// Save the new user's data to the database
		const newUser = new User(newUserObject)
		newUser.save()

		// Send an OTP verification email to the new user's email address
		console.log(`sending ${email} to sendVerificationEmail`)
		const verificationEmailSentStatus = await sendVerificationEmail(randomString, email)
		if (verificationEmailSentStatus == 1) {
			return res.status(200).json(generateResponseMessage("success", `Email sent, user needs to check mail in ${email}`))
		} else {
			return res.status(400).json(generateResponseMessage("error", `unable to send email to: ${email}`))
		}
	} catch (error) {
		// If there are errors during user creation or email sending, return a 500 Internal Server Error status code
		logger.error(error)
		return res.status(500).json(generateResponseMessage("error", error))
	}
})



module.exports = router