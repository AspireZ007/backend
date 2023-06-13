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

const { loginValidator, signupValidator , otpValidator , passwordValidator , usernameValidator} = require('./validators')
const { generateResponseMessage } = require('../../helpers/response')

// Constants

const { USERSTATUS_CODES } = require("../../db/models/user/model")

// Instantiating the router object
const router = express.Router()

// TODO: finish these routes
router.post('/forgotPassword', async (req, res) => {

	const userId = req.userId

	// overwhelming parameters
	if(req.body.length > 2){
		return res.status(400).json(generateResponseMessage("error", "Invalid request"))
	}

	try{
		// check if user exists with given id
		const user = await User.findById(userId)

		if(!user){
			return res.status(400).json(generateResponseMessage("error", "User does not exist"))
		}

		// fetch old password from database
		const hashedOldPassword = await User.findById(userId).select('password')
		req.body.oldPassword = hashedOldPassword

		const resetPasswordReq = {
			...req,
			url: '/resetPassword',
			method: 'PUT',
			body: req.body,
		};
	  
		// Handle the resetPassword route internally
		req.app.handle(resetPasswordReq, res);
	}
	catch(error){
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
router.put('/resetPassword', async(req, res) => {
	const {oldPassword, newPassword , confirmNewPaswword } = req.body

	// overwhelming parameters
	if(req.body.length > 3){
		return res.status(400).json(generateResponseMessage("error", "Invalid request"))
	}

	// check if all parameters are present
	if(!oldPassword || !newPassword || !confirmNewPaswword){
		return res.status(400).json(generateResponseMessage("error", "All fields are required"))
	}

	// check if old password is same as new password
	if(oldPassword === newPassword){
		return res.status(400).json(generateResponseMessage("error", "New password cannot be same as old password"))
	}

	// check if new password and confirm new password are same
	if(newPassword !== confirmNewPaswword){
		return res.status(400).json(generateResponseMessage("error", "Passwords do not match"))
	}

	// remove confirm new password from request body
	delete req.body.confirmNewPaswword

	// validate old password
	const {oldPasswordError} = passwordValidator.validate({password: oldPassword})
	if(oldPasswordError){
		return res.status(400).json(generateResponseMessage("error", "Old password : " + error.details[0].message))
	}

	// validate new password
	const {newPasswordError} = passwordValidator.validate({password: newPassword})
	if(newPasswordError){
		return res.status(400).json(generateResponseMessage("error", "New password : " + error.details[0].message))
	}

	const userId = req.userId

	try{
		// check if user exists with given id
		const user = await User.findById(userId)

		if(!user){
			return res.status(400).json(generateResponseMessage("error", "User does not exist"))
		}

		// check if old password is correct
		const isMatch = await bcrypt.compare(oldPassword, user.password)

		if(!isMatch){
			return res.status(400).json(generateResponseMessage("error", "Old password is incorrect"))
		}

		// hash the new password
		const hashedPassword = await hashPassword(newPassword)

		// update the user record
		user.password = hashedPassword

		// save the user record
		await user.save()

		res.json(generateResponseMessage("success", "Password changed successfully"))
	}
	catch(error){
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
	const {username} = req.body

	// validate username
	const {error} = usernameValidator.validate({username})

	if (error) {
		return res.status(400).json(generateResponseMessage("error", error.details[0].message))
	}

	try {

		// check if user exists with given username
		const user = await User.findOne({username})

		if (user) {
			return res.json(generateResponseMessage("error", "Username already taken"))
		}

		res.json(generateResponseMessage("success", "Username available"))
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
router.post('/verify/:otp', async(req, res) => {

	// extract otp
	const otp = req.params.otp

	//validate otp
	const {error} = otpValidator.validate({otp : otp})

	if(error) {
		return res.status(400).json(generateResponseMessage("error", error.details[0].message))
	}
	try{
		//check if OTP is valid and does exist in our database
		const user = await User.findOne({otp},{
			status: 1 , otp : 1
		})
		if(!user) {
			return res.status(400).json(generateResponseMessage("error", "Invalid OTP"))
		}

		//change user status to permanent from temporary
		user.status = USERSTATUS_CODES.PERMANENT

		//nullify otp as we have no use of it further
		user.otp = null

		//update the user record
		await user.save()
		res.json(generateResponseMessage("success", "User Verified Successfully"))
	}
	catch(error){
		logger.error(error)
		res.status(400).json(generateResponseMessage("error" , error.message))
	}
})

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
			return res.status(400).json({ message: 'Login Prohibited' })
		}

		const tokenPayload = {
			...user.toObject(),
			loginTime: new Date().toString()
		}
		delete tokenPayload.password
		delete tokenPayload.status

		const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, { //jwt token content to be reviewed
			expiresIn: '1h'
		})
		res.json({ token })
	} catch (error) {
		logger.error(error)
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