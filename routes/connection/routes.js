// External Import
const express = require('express')

// Database
const Connection = require('../../db/models/connection/model')

// Validators 
const { connectValidator } = require('./validators')

// Helpers
const { isUserActive } = require('../../helpers/db')
const { checkJwt } = require('../../helpers/jwt')
const { generateResponseMessage } = require('../../helpers/response')

// Logger
const logger = require("../../helpers/logger.js")

// Instantiating the router object
const router = express.Router()
router.use(checkJwt)

/**
 * @param {Object} req - The HTTP request object (contains the follower and followee UUIDs)
 * @param {Object} res - The HTTP response object.
 */
router.post('/create', async (req, res) => {

	// validate the request body
	const { error } = connectValidator.validate(req.body) // validate the request body
	if (error)
		return res.status(400).send(error.details[0].message) // send a clear error message if validation fails

	const userId = req.userId // from the middleware checkJWT
	const { followeeId } = req.body

	if (!followeeId) {
		return res.status(400).json(generateResponseMessage("error", "Missing required parameters"))
	}

	//check if the follower user exists
	const followerExists = await isUserActive(userId)

	if (followerExists !== 1) {
		const outputString =  "The asker's account is " +
			(followerExists == -1) ? "throwing a db error" :
			(followerExists == -2) ? "not a valid id" :
			(followerExists == 0) ? "not found with this id" :
			(followerExists == 2) ? "is only temporarily registered" :
			(followerExists == 3) ? "is banned" : `!! returning ${followerExists}`
		return res.status(403).json(generateResponseMessage("error", outputString))
	} 

	const followeeExists = await isUserActive(followeeId)

	if (followeeExists !== 1){
		const outputString =  "The target to follow's account is " +
			(followeeExists == -1) ? "throwing a db error" :
			(followeeExists == -2) ? "not a valid id" :
			(followeeExists == 0) ? "not found with this id" :
			(followeeExists == 2) ? "is only temporarily registered" :
			(followeeExists == 3) ? "is banned" : `!! returning ${followeeExists}`
		return res.status(403).json(generateResponseMessage("error", outputString))
	}

	try {
		const existingConnection = await Connection.find({ followee: followeeId, follower: userId })

		//check if the connection already exists
		if (existingConnection.length > 0) {
			return res.status(409).json(generateResponseMessage("error", "Connection already exists"))
		}

		//completing all the validations and creating the connection
		const connection = new Connection({ followee: followeeId, follower: userId })
		await connection.save()
		return res.status(200).json(generateResponseMessage("success", "Connection created successfully"))
	}
	catch (error) {
		logger.error(error)
		return res.status(500).json(generateResponseMessage("error", error))
	}
})

/**
 * @param {Object} req - The HTTP request object (contains the follower and followee UUIDs)
 * @param {Object} res - The HTTP response object.
 */
router.post('/remove', async (req, res) => {

	const { error } = connectValidator.validate(req.body) // validate the request body
	if (error)
		return res.status(400).send(error.details[0].message) // send a clear error message if validation fails

	const userId = req.userId // from the middleware checkJWT
	const { followeeId } = req.body

	//check for the case when null is passed as a parameter
	if (!followeeId) {
		return res.status(400).json(generateResponseMessage("error", "Missing required parameters"))
	}

	const followerExists = await isUserActive(userId)

	if (followerExists !== 1) {
		const outputString =  "The asker's account is " +
			(followerExists == -1) ? "throwing a db error" :
			(followerExists == -2) ? "not a valid id" :
			(followerExists == 0) ? "not found with this id" :
			(followerExists == 2) ? "is only temporarily registered" :
			(followerExists == 3) ? "is banned" : `!! returning ${followerExists}`
		return res.status(403).json(generateResponseMessage("error", outputString))
	} 

	const followeeExists = await isUserActive(followeeId)

	if (followeeExists !== 1){
		const outputString =  "The target to follow's account is " +
			(followeeExists == -1) ? "throwing a db error" :
			(followeeExists == -2) ? "not a valid id" :
			(followeeExists == 0) ? "not found with this id" :
			(followeeExists == 2) ? "is only temporarily registered" :
			(followeeExists == 3) ? "is banned" : `!! returning ${followeeExists}`
		return res.status(403).json(generateResponseMessage("error", outputString))
	}

	try {

		//check if the connection exists or not
		const existingConnection = await Connection.find({ followee: followeeId, follower: userId })
		if (existingConnection.length === 0) {
			return res.status(404).json(generateResponseMessage("error", "Connection does not exist"))
		}

		//completing all the validations and deleting the connection
		const deletedConnection = await Connection.deleteOne({ followee: followeeId, follower: userId })
		return res.status(200).json(generateResponseMessage("success", "Connection deleted successfully"))
	}
	catch (error) {
		logger.error(error)
		return res.status(500).json(generateResponseMessage("error", "Internal Server Error"))
	}
})

module.exports = router