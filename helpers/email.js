require("dotenv").config()
const nodemailer = require('nodemailer')

const logger = require('./logger')

// declaring constants
const TRANSPORTER = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: 587,
	secureConnection: false,
	tls: {
		ciphers: "SSLv3",
	},
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS
	}
})

/**
 * Sends a verification email to the specified receiver containing the generated randomized string for resetting password.
 *
 * @param {string} otp - The randomized string to include in the verification link.
 * @param {string} receiver - The email address of the person receiving the verification email.
 * @returns {Promise<number>} A Promise that resolves with 1 if the email is sent successfully, otherwise -1.
 */
const sendPasswordResetEmail = async (otp, receiverEmailString) => {

	console.log({receiverEmailString})

	// Create a nodemailer transporter using SMTP configuration
	

	// Compose the verification email message as an HTML string
	const message = `Hi! There, Someone has attempted to reset your password to our website AspireZ.
		Please follow the given link to reset your password.
		http://localhost:3000/auth/reset/${otp}.

		Ignore, if this wasnt you!

		Thanks`

	// Construct the mail options object for nodemailer
	const mailOptions = {
		from: process.env.SMTP_USER,
		to: receiverEmailString,
		subject: 'Reset password to AspireZ',
		html: message
	}

	try {	
		const info = await TRANSPORTER.sendMail(mailOptions)
		// Attempt to send the email using the transporter and mail options
		logger.info(`Reset password email sent to ${receiverEmailString}`)
		return 1
	} catch (err) {
		// Log any errors and return a status indicating failure
		logger.error(`Error in sending reset password email to ${receiverEmailString}`, err)
		return -1
	}
}

/**
 * Sends a verification email to the specified receiver containing the generated randomized string.
 *
 * @param {Object} options - The options object for sending the verification email.
 * @param {string} options.otp - The randomized string to include in the verification link.
 * @param {string} options.receiver - The email address of the person receiving the verification email.
 * @returns {Promise<number>} A Promise that resolves with 1 if the email is sent successfully, otherwise -1.
 */
const sendVerificationEmail = async (otp, receiverEmailString) => {

	console.log({receiverEmailString})

	// Create a nodemailer transporter using SMTP configuration
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: 587,
		secureConnection: false,
		tls: {
			ciphers: "SSLv3",
		},
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS
		}
	})

	// Compose the verification email message as an HTML string
	const message = `Hi! There, You have attempted to register to our website AspireZ.
		Please follow the given link to verify your email
		http://localhost:3000/auth/verify/${otp}.
		Thanks`

	// Construct the mail options object for nodemailer
	const mailOptions = {
		from: process.env.SMTP_USER,
		to: receiverEmailString,
		subject: 'Welcome to AspireZ',
		html: message
	}

	try {	
		const info = await transporter.sendMail(mailOptions)
		// Attempt to send the email using the transporter and mail options
		logger.info(`Verfication email sent to ${receiverEmailString}`)
		return 1
	} catch (err) {
		// Log any errors and return a status indicating failure
		logger.error(`Error in sending email to ${receiverEmailString}`, err)
		return -1
	}
}

/**
 * Generate a random string of alphabets and numbers of length 20
 *
 * @returns {string} A random string containing only alphabets and numbers.
 */
const getRandomString = () => {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	let result = ''
	for (var i = 0; i < 20; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length)
		result += chars[randomIndex]
	}
	return result
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, getRandomString }