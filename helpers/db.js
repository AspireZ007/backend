const mongoose = require("mongoose")

const User = require("../db/models/user/model")

const { USERSTATUS_CODES } = require("../db/models/user/model")

const logger = require("./logger")


/**
 * Connect to a MongoDB database using Mongoose.
 *
 * @returns {Promise<boolean>} - A Promise that resolves to a boolean 
 * 	indicating whether the connection was successful.
 */
const connectToDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		console.log("Database connection successful.")
		logger.info("Database connection successful.")
		return true
	} catch (err) {
		console.log('MongoDB connection error: ', err)
		logger.error('MongoDB connection error: ', err)
		return false
	}
}

/**
 * Asynchronously checks if a user exists in the database based on their email and username
 * @param {string} email - The email of the user to check for.
 * @param {string} username - The username of the user to check for.
 * @returns {number} Returns 0 if the user is not found. Otherwise, returns:
 *                    - 1 if the user's status is PERMANENT.
 *                    - 2 if the user's status is TEMPORARY.
 *                    - 3 if the user's status is BANNED.
 *                    - 4 if the user's username is already taken
 *                    - -1 if an error occurs during the database query.
 *                    - -2 if more than 2 records found
 */
const checkIfUserExists = async (email, username) => {
	try {
		const users = await User.find({ $or: [{ email }, { username }] })

		if (users.length === 0) {
			// No matching users found
			return 0
		} else if (users.length === 1 || (users.length === 2)) {

			for (const matchedUser of users) {
				if (matchedUser.email === email) {
					if (matchedUser.status == USERSTATUS_CODES.PERMANENT) {
						return 1
					} else if (matchedUser.status == USERSTATUS_CODES.TEMPORARY) {
						return 2
					} else {
						return 3
					}
				}
			}

			for (const matchedUser of users) {
				if (matchedUser.username === username) {
					return 4
				}
			}
		} else {
			// more than 2 matches on 2 fields that are unique, impossible
			return -2
		}
	} catch (error) {
		logger.error(error)
		return -1
	}
}

module.exports.checkIfUserExists = checkIfUserExists
module.exports.connectToDatabase = connectToDatabase
