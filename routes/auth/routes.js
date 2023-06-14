// External Import
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")
const express = require('express')
const jwt = require("jsonwebtoken")

// Helpers
const { sendVerificationEmail, getRandomString } = require('../../helpers/email')
const { checkIfUserExists } = require('../../helpers/db')
const { hashPassword } = require('../../helpers/password')
const { checkJwt } = require('../../helpers/jwt')

// Logger
const logger = require('../../helpers/logger')

// Database
const User = require('../../db/models/user/model')
const { loginValidator, signupValidator, otpValidator, passwordValidator, usernameValidator } = require('./validators')


const { generateResponseMessage } = require('../../helpers/response')

// Constants

const { USERSTATUS_CODES } = require("../../db/models/user/model")

// Instantiating the router object
const router = express.Router()

// TODO: finish these routes
router.post('/forgotPassword', async (req, res) => {

	// overwhelming parameters

	if (req.body.length > 3) {
		return res.status(400).json(generateResponseMessage("error", "Invalid request"))
	}

	const { userId, newPassword, confirmNewPassword } = req.body

	if (!newPassword || !confirmNewPassword) {
		return res.status(400).json(generateResponseMessage("error", "All fields are required"))
	}

	if (newPassword !== confirmNewPassword) {
		return res.status(400).json(generateResponseMessage("error", "Passwords do not match"))
	}

	const newPasswordError = passwordValidator.validate({ password: newPassword })

	if (newPasswordError) {
		return res.status(400).json(generateResponseMessage("error", "New password : " + error.details[0].message))
	}

	try {
		// check if user exists with given id
		const user = await User.findById(userId)

		if (!user) {
			return res.status(400).json(generateResponseMessage("error", "User does not exist"))
		}

		const newHashedPassword = await hashPassword(newPassword)
		user.password = newHashedPassword

		await user.save()
		res.status(200).json(generateResponseMessage("success", "Password changed successfully"))

	}
	catch (error) {
		logger.error(error)
		res.status(400).json(generateResponseMessage("error", error.message))
	}
})


/**
 * Route to reset user's password
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
router.put('/resetPassword', checkJwt, async (req, res) => {
	const { oldPassword, newPassword, confirmNewPassword } = req.body

	// overwhelming parameters
	if (req.body.length > 3) {
		return res.status(400).json(generateResponseMessage("error", "Invalid request"))
	}

	// check if all parameters are present
	if (!oldPassword || !newPassword || !confirmNewPassword) {
		return res.status(400).json(generateResponseMessage("error", "All fields are required"))
	}

	// check if old password is same as new password
	if (oldPassword === newPassword) {
		return res.status(400).json(generateResponseMessage("error", "New password cannot be same as old password"))
	}

	// check if new password and confirm new password are same
	if (newPassword !== confirmNewPassword) {
		return res.status(400).json(generateResponseMessage("error", "Passwords do not match"))
	}

	// remove confirm new password from request body
	delete req.body.confirmNewPassword

	// validate old password
	const { oldPasswordError } = passwordValidator.validate({ password: oldPassword })
	if (oldPasswordError) {
		return res.status(400).json(generateResponseMessage("error", "Old password : " + error.details[0].message))
	}

	// validate new password
	const { newPasswordError } = passwordValidator.validate({ password: newPassword })
	if (newPasswordError) {
		return res.status(400).json(generateResponseMessage("error", "New password : " + error.details[0].message))
	}

	const userId = req.userId

	try {
		// check if user exists with given id
		const user = await User.findById(userId)

		if (!user) {
			return res.status(400).json(generateResponseMessage("error", "User does not exist"))
		}

		// check if old password is correct
		const isMatch = await bcrypt.compare(oldPassword, user.password)

		if (!isMatch) {
			return res.status(400).json(generateResponseMessage("error", "Old password is incorrect"))
		}

		// hash the new password
		const hashedPassword = await hashPassword(newPassword)

		// update the user record
		user.password = hashedPassword

		// save the user record
		await user.save()

		res.status(200).json(generateResponseMessage("success", "Password changed successfully"))
	}
	catch (error) {
		logger.error(error)
		res.status(400).json(generateResponseMessage("error", error.message))
	}
})


/**
 * Route to check if username is already in use or not
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
router.post('/usernameAvailable', async (req, res) => {

	// fetch username from request body
	const { username } = req.body

	// validate username
	const { error } = usernameValidator.validate({ username })

	if (error) {
		return res.status(400).json(generateResponseMessage("error", error.details[0].message))
	}

	try {

		// check if user exists with given username
		const user = await User.findOne({ username })

		if (user) {
			return res.status(200).json(generateResponseMessage("error", "Username already taken"))
		}

		res.status(200).json(generateResponseMessage("success", "Username available"))
	}
	catch (error) {
		logger.error(error)
		res.status(400).json(generateResponseMessage("error", error.message))
	}
})

/**
 * Route to verify otp received upon signing up
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
router.post('/verify/:otp', async (req, res) => {

	// extract otp
	const otp = req.params.otp

	//validate otp
	const { error } = otpValidator.validate({ otp: otp })

	if (error) {
		return res.status(400).json(generateResponseMessage("error", error.details[0].message))
	}
	try {
		//check if OTP is valid and does exist in our database
		const user = await User.findOne({ otp }, {
			status: 1, otp: 1
		})
		if (!user) {
			return res.status(400).json(generateResponseMessage("error", "Invalid OTP"))
		}

		//change user status to permanent from temporary
		user.status = USERSTATUS_CODES.PERMANENT

		//nullify otp as we have no use of it further
		user.otp = null

		//update the user record
		await user.save()
		res.status(200).json(generateResponseMessage("success", "User Verified Successfully"))
	}
	catch (error) {
		logger.error(error)
		res.status(400).json(generateResponseMessage("error", error.message))
	}
})

/** Route to authenticate using email, password and return a token
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - auth
 *     description: Authenticates user and issues a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: abcde@efg.com
 *               password:
 *                 type: string
 *                 required: true
 *                 example: abcABC123!@#
 *     responses:
 *       200:
 *         description: User authenticated and token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNjc5ODcyMTM2fQ.p07pPkoR2uDYWN0d_JT8uQ6cOv6tO07xIsS-BaM9bWs
 *       400:
 *         description: Invalid request body parameters
 *       404:
 *         description: User not found
 *       401:
 *         description: Wrong password
 *       403:
 *         description: User banned or deleted
 *       406:
 *         description: User registration incomplete
 *       500:
 *         description: Server error
 */
router.post("/login", async (req, res) => {

	// validate the request body
	const { error } = loginValidator.validate(req.body)
	if (error)
		return res.status(400).send(error.details[0].message)

	// body params
	const { email, password } = req.body

	try {
		// query db
		const userDBObject = await User.findOne({ email })

		// if user not found
		if (!userDBObject) {
			return res.status(404).json({ message: 'No username found with this email.' })
		}

		// if passwords dont match
		const match = await bcrypt.compare(password, userDBObject.password)
		if (!match) {
			return res.status(401).json({ message: 'Wrong password, unauthorized.' })
		}

		// if user is banned
		if (userDBObject.status === USERSTATUS_CODES.BANNED) {
			return res.status(403).json({ message: 'Login Prohibited' })
		}

		// if user is temporary
		if (userDBObject.status !== USERSTATUS_CODES.TEMPORARY) {
			return res.status(406).json({ message: 'User login incomplete, request not accepted.' })
		}

		// issue token
		const tokenPayload = {
			_id: userDBObject._id,
			firstname: userDBObject.firstname,
			lastname: userDBObject.lastname,
			email: userDBObject.email,
			username: userDBObject.username,
			loginTime: new Date().toString()
		};
		const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
			expiresIn: process.env.TOKEN_TIMEOUT
		})

		// issued
		res.status(200).json({ token })
	} catch (error) {
		// some error
		logger.error(error)
		res.status(500).json({ message: 'Server Error' })
	}
})

/** Route to sign a user up and send a validation email.
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register the user
 *     tags:
 *       - auth
 *     description: Allows end user to register, and if successful recieve a confirmation email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: abcde@efg.com
 *               password:
 *                 type: string
 *                 required: true
 *                 example: abcABC123!@#
 *               firstname:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: John
 *               lastname:
 *                 type: string
 *                 required: true
 *                 example: Doe
 *               username:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: JohnDone
 *               phone:
 *                 type: string
 *                 required: true
 *                 example: 9876543210
 *               college:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: Indian Institute of Technology, Kharagpur
 *     responses:
 *       200:
 *         description: Registration successful, confirmation email sent to email address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: success or error
 *                   example: success
 *                 data:
 *                   type: string
 *                   description: confirmation message in case of "status" success
 *                   example: Email sent, user needs to check mail in abcde@fgh.com
 *                   required: false
 *                 error:
 *                   type: string
 *                   description: error message in case of "status" error
 *                   required: false
 *       400:
 *         description: Invalid request body parameters
 *       500:
 *         description: Server error in contacting database or sending email
 *       418:
 *         description: More than 2 objects found with email or username, impossible
 *       409:
 *         description: User already registered
 *       412:
 *         description: User already exists
 *       401:
 *         description: User banned
 *       422:
 *         description: Username already taken
 */
router.post("/signup", async (req, res) => {

	// validate the request body
	const { error } = signupValidator.validate(req.body)
	if (error)
		return res.status(400).json(generateResponseMessage("error", error.details[0].message))

	// body params
	const { firstname, lastname, email, password, phone, username, college } = req.body

	try {
		// query db if email or username already exists
		const userExistsStatus = await checkIfUserExists(email, username)
		switch (userExistsStatus) {
			case -1:
				// -1 if an error occurs during the database query
				return res.status(500).json(generateResponseMessage("error", "unable to contact the database temporarily"))
			case -2:
				// -1 if an unexpected error occurs during the database query
				return res.status(418).json(generateResponseMessage("error", "database constraint broken!"))

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
		console.log(`sending ${email} to sendVerificationEmail with otp ${randomString}`)
		logger.log(`sending ${email} to sendVerificationEmail with otp ${randomString}`)
		const verificationEmailSentStatus = await sendVerificationEmail(randomString, email)
		if (verificationEmailSentStatus == 1) {
			return res.status(200).json(generateResponseMessage("success", `Email sent, user needs to check mail in ${email}`))
		} else {
			return res.status(500).json(generateResponseMessage("error", `unable to send email to: ${email}`))
		}
	} catch (error) {
		// If there are errors during user creation or email sending, return a 500 Internal Server Error status code
		logger.error(error)
		return res.status(500).json(generateResponseMessage("error", error))
	}
})


module.exports = router