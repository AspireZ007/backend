const bcrypt = require('bcryptjs');
const dotenv = require("dotenv")
const logger = require("./logger");

/* Helper function to match passwords
 * @param {string} userPassword      The password provided by the user as a string.
 * @param {string} dbPassword        The hashed password retrieved from the database as a string.
 * @returns {boolean}                Returns true if passwords match, false otherwise.
 */
const matchPasswords = async (userPassword, dbPassword) => {
	try {
		const result = await bcrypt.compare(userPassword, dbPassword)
		return result
	} catch (err) {
		logger.error(err)
		return false
	}
}

/**
 * Hashes a plaintext password using bcrypt's hash() function with a salt value from the environment variables.
 * 
 * @param {string} plaintextPassword     The password to be hashed as a string.
 * @returns {string}                      The resulting hashed password or undefined if an error occurred.
 */
const hashPassword = async (plaintextPassword) => {
	// Hashing password
	try {
		const hash = await bcrypt.hash(plaintextPassword, parseInt(process.env.SALT))
		return hash
	} catch (err) {
		logger.error(err)
		return
	}
}

module.exports = { matchPasswords, hashPassword }