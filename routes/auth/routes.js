// External Import
const express = require('express')
const router = express.Router()

// JWT Token Dependency
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Email Helper
const { sendMail } = require('../../helpers/email')

// Database
const User = require('../../db/models/user/model')
const index = require("../../db/index") // TO BE DELETED
const { loginValidator } = require('./validators')
const signupValidation = require('../../validation/signup')

// Constants
const dotenv = require("dotenv")
const ERROR_CODES = require('../../constants/errorCodes')
const { USERSTATUS_CODES } = require("../../db/models/user/model")


// TODO: finish these routes
// router.post('/forgotPassword', authController.forgotPassword)
// router.put('/resetPassword/:token', authController.resetPassword)
// router.post('/usernameAvailable', authController.isUsernameAvailable)

/**
 * Handles user authentication and generates a JSON web token.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
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
				_id: 1, firstName: 1, lastName: 1, email: 1,
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
		console.log(tokenPayload)

		const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
			expiresIn: '1h'
		})
		res.json({ token })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Server Error' })
	}
})

router.post("/signup", async (req, res) => {
	const payload = req.body
	const { name, email, password, phone_number, username, college, confirm_password } = payload
	signupValidation(payload).then((validation_result) => {
		if (validation_result == "200") {
			const hashedpassword = bcrypt.hashSync(password, SALT)
			const token = jwt.sign({ email: email, username: username }, SECRET_KEY)
			const b = token.split(".")[1]
			index.createUser(name, email, hashedpassword, phone_number, username, null, college, token).then((httpcode) => {
				if (httpcode == 201) {
					sendMail(token, req.body.email)
					res.status(201).json({ message: ERROR_CODES['201a'] })
				} else if (httpcode == 409) {
					res.status(409).json({ error: ERROR_CODES['409a'] })
				} else {
					res.status(500).json({ error: ERROR_CODES['500'] })
				}
			})
		}
		else {
			res.status(400).json({ error: ERROR_CODES[validation_result] })
		}
	})
})



/**
 * email verification get request
 * @param {string} token
 */
router.get("/verify/:token", async (req, res) => {
	const token = req.params.token
	try {
		user = await index.getDetailsByToken(token)
		if (!user) res.status(400).json({ error: ERROR_CODES['400'] })
	}
	catch (err) {
		res.status(500).json({ message: ERROR_CODES['500'] })
	}
	const user_id = user.username
	const b = token.split(".")[1]
	const decrpt = JSON.parse(Buffer.from(b, "base64").toString("ascii"))
	const recived_id = decrpt.username

	//status of the user should be changed to verified
	if (user_id == recived_id) {
		res.status(201).send(ERROR_CODES['201b'])
	} else {
		res.status(400).json({ error: ERROR_CODES['400'] })
	}
})

module.exports = router