// External Import
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")
const express = require('express')
const jwt = require("jsonwebtoken")

// Helpers
const { sendVerificationEmail, getRandomString, sendPasswordResetEmail } = require('../../helpers/email')
const { checkIfUserExists } = require('../../helpers/db')
const { hashPassword } = require('../../helpers/password')
const logger = require('../../helpers/logger')
const { generateResponseMessage } = require('../../helpers/response')

// Database
const User = require('../../db/models/user/model')
const { USERSTATUS_CODES } = require("../../db/models/user/model")
const { loginValidator, signupValidator, otpValidator, usernameAvailableValidator, forgotPasswordValidator, resetPasswordValidator } = require('./validators')

// Instantiating the router object
const router = express.Router()

/** Route to check if a username is available
 * @swagger
 * /auth/forgotPassword:
 *   post:
 *     summary: Check if a username is available
 *     tags:
 *       - auth
 *     description: Send a password reset email to a user with a randomly generated password reset link
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
 *                 example: abcde@efg.com
 *                 required: true
 *                 description: Email of the user to send the password reset email to
 *     responses:
 *       200:
 *         description: Email sent successfully with reset link to frontend redirection.
 *         content:
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
 *                   example: Username Available
 *                   required: false
 *                 error:
 *                   type: string
 *                   description: error message in case of "status" error
 *                   required: false
 *       400:
 *         description: Parameters validation failed
 *       404:
 *         description: No user exists with the given email
 *       500:
 *         description: Internal server error while sending email or contacting db
 */
router.post('/forgotPassword', async (req, res) => {

	// validate the request body
	const { error } = forgotPasswordValidator.validate(req.body)
	if (error)
		return res.status(400).json(generateResponseMessage("error", error))

	// body params
	const { email } = req.body

	try {

		// check if user exists by email
		const userDBObject = await User.findOne({ email })

		if (!userDBObject) { // user does not exist
			return res.status(404).json(generateResponseMessage("error", "No user exists with this email."))
		} else {
			const randomString = getRandomString()

			// update the user record
			userDBObject.otp = randomString

			// save the user record
			await userDBObject.save()

			// attempt to sent email with reset link
			const resetPasswordEmailSentStatus = await sendPasswordResetEmail(randomString, email)
			if (resetPasswordEmailSentStatus == 1) {
				logger.info("success", `Email sent, user needs to reset password using link in ${email} with OTP ${otp}`)
				return res.status(200).json(generateResponseMessage("success", `Email sent, user needs to reset password using link in ${email}`))
			} else {
				return res.status(500).json(generateResponseMessage("error", `unable to send email to: ${email}`))
			}
		}
	} catch (err) {
		// if errors exist while fetching database
		logger.error(err)
		return res.status(500).json(generateResponseMessage("error", err))
	}
})

/** Route to reset the password of a user through, resetOtp recieved via email
 * @swagger
 * /auth/resetpassword/{otp}:
 *   put:
 *     summary: To update existing password with a new one
 *     tags:
 *       - auth
 *     description: Verify the otp recieved through email and make user permanent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: def456DEF$%^
 *                 required: true
 *                 description: new password of the user to be set to.
 *     parameters:
 *       - name: otp
 *         in: path
 *         description: otp recieved through email for /auth/forgotpassword route
 *         required: true
 *         example: LL3bFTYDdR324DDLIjQn
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password updation success.
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
 *                   example: otp verification success, user can now login
 *                   required: false
 *                 error:
 *                   type: string
 *                   description: error message in case of "status" error
 *                   required: false
 *       400:
 *         description: Invalid request parameters in URL or in body
 *       500:
 *         description: Server error in contacting database
 *       404:
 *         description: No user found with this OTP, invalid or expired
 */
router.put('/resetpassword/:otp', async (req, res) => {

	// validate the request body
	const { error } = resetPasswordValidator.validate(req.body)
	if (error)
		return res.status(400).json(generateResponseMessage("error", error))

	// validate the request params
	const { r_error } = otpValidator.validate(req.params)
	if (r_error)
		return res.status(400).json(generateResponseMessage("error", r_error))

	const { newPassword } = req.body
	const { otp } = req.params

	try {
		//check if OTP is valid and does exist in our database
		const user = await User.findOne({ resetOtp: otp, status: USERSTATUS_CODES.PERMANENT })
		if (!user) {
			return res.status(404).json(generateResponseMessage("error", "No user found with this resetOtp."))
		}

		//change user status to permanent from temporary
		user.status = USERSTATUS_CODES.PERMANENT
		
		// has the new password
		const hashedPassword = await hashPassword(password)

		// update the user object
		user.resetOtp = undefined
		user.password = hashedPassword

		//update the user record
		await user.save()
		res.status(200).json(generateResponseMessage("success", "User password updated Successfully"))
	}
	catch (error) {
		logger.error(error)
		res.status(500).json(generateResponseMessage("error", error))
	}
})

/** Route to check if a username is available
 * @swagger
 * /auth/usernameAvailable:
 *   post:
 *     summary: Check if a username is available
 *     tags:
 *       - auth
 *     description: Verify if the username is available 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 required: true
 *                 example: JohnDoe
 *     responses:
 *       200:
 *         description: Username is available
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
 *                   example: Username Available
 *                   required: false
 *                 error:
 *                   type: string
 *                   description: error message in case of "status" error
 *                   required: false
 *       400:
 *         description: Invalid body parameters
 *       500:
 *         description: Server error in contacting database
 *       409:
 *         description: Username is unavailable
 */
router.post('/usernameAvailable', async (req, res) => {

	// validate the request body
	const { error } = usernameAvailableValidator.validate(req.params)
	if (error)
		return res.status(400).json(generateResponseMessage("error", error))

	// extract username
	const { username } = req.body

	try {

		// check if user exists with given username
		const user = await User.findOne({ username })

		if (user) {
			return res.status(409).json(generateResponseMessage("error", "Username already taken"))
		}

		res.status(200).json(generateResponseMessage("success", "Username available"))
	}
	catch (error) {
		logger.error(error)
		res.status(500).json(generateResponseMessage("error", error.message))
	}
})

/** Route to validate a registration through otp link in email
 * @swagger
 * /auth/verify/{otp}:
 *   get:
 *     summary: Verify a temporary user, via email OTP
 *     tags:
 *       - auth
 *     description: Verify the otp recieved through email and make user permanent
 *     parameters:
 *       - name: otp
 *         in: path
 *         description: The otp of the forgot password case
 *         required: true
 *         example: LL3bFTYDdR324DDLIjQn
 *         schema:
 *           type: string
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
 *                   example: otp verification success, user can now login
 *                   required: false
 *                 error:
 *                   type: string
 *                   description: error message in case of "status" error
 *                   required: false
 *       400:
 *         description: Invalid request parameters in URL
 *       500:
 *         description: Server error in contacting database
 *       404:
 *         description: No user found with this OTP, invalid or expired
 */
router.get('/verify/:otp', async (req, res) => {

	// validate the request body
	const { error } = otpValidator.validate(req.params)
	if (error)
		return res.status(400).json(generateResponseMessage("error", error))

	// extract otp
	const { otp } = req.params

	try {
		//check if OTP is valid and does exist in our database
		const user = await User.findOne({ otp })
		if (!user) {
			return res.status(404).json(generateResponseMessage("error", "No user with such OTP found."))
		}

		//change user status to permanent from temporary
		user.status = USERSTATUS_CODES.PERMANENT

		//remove otp as we have no use of it further
		user.otp = undefined

		//update the user record
		await user.save()
		res.status(200).json(generateResponseMessage("success", "User Verified Successfully"))
	}
	catch (error) {
		logger.error(error)
		res.status(500).json(generateResponseMessage("error", error))
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
		return res.status(400).send(error)

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
		if (userDBObject.status === USERSTATUS_CODES.TEMPORARY) {
			return res.status(406).json({ message: 'User login incomplete, request not accepted.' })
		}

		// issue token
		const tokenPayload = {
			id: userDBObject.id,
			firstname: userDBObject.firstname,
			lastname: userDBObject.lastname,
			email: userDBObject.email,
			username: userDBObject.username,
			loginTime: new Date().toString(),
			role: userDBObject.role
		}
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
		return res.status(400).json(generateResponseMessage("error", error))

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
		// console.log("sending " + email + " to sendVerificationEmail with otp " + randomString)
		// logger.log("sending " + email + " to sendVerificationEmail with otp " + randomString)
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