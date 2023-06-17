// External Import
const express = require('express')

// Database
const { Connection, CONNECTIONSTATUS_CODES } = require('../../db/models/connection/model')

// Validators 
const { idValidator } = require('./validators')

// Helpers
const { isUserActive } = require('../../helpers/db')
const { checkJwt } = require('../../helpers/jwt')
const { generateResponseMessage } = require('../../helpers/response')

// Logger
const logger = require("../../helpers/logger")
const User = require('../../db/models/user/model')

// Instantiating the router object
const router = express.Router()

// Middleware to check for valid JWT token in header (authorization)
router.use(checkJwt)

/** Retrieves a list of followees for a given follower ID.
 * @async
 * @function
 * @name _getFolloweesById
 * @param {string} followerId - The ID of the follower to retrieve followees for.
 * @returns {Promise<Array>} - A promise that resolves to an array of followee documents or undefined in case of error.
 */
const _getFolloweesById = async (followerId) => {
	try {
		// Find followees matcheing followerId
		const followees = await Connection.find({ follower: followerId, isBlocked: CONNECTIONSTATUS_CODES.ALLOWED }, 'following')
			.populate({
				path: 'following',
				select: 'username firstname lastname profilepic'
			})

		const responseObj = followees.map((connectionObject => connectionObject.following))
		return responseObj
	} catch (err) {
		console.log(err)
		logger.error(err)
		// Return nothing if an error occurs
		return
	}
}

/** Retrieves a list of followers for a given followee ID.
 * @async
 * @function
 * @name _getFollowersById
 * @param {string} followeeId - The ID of the followee to retrieve followers for.
 * @returns {Promise<Array>} - A promise that resolves to an array of follower documents or undefined in case of error.
 */
const _getFollowersById = async (followeeId) => {
	try {
		// Find followers matcheing followeeId
		const followers = await Connection.find({ following: followeeId, isBlocked: CONNECTIONSTATUS_CODES.ALLOWED }, 'follower')
			// populate followers actual data
			.populate({
				path: 'follower',
				select: 'id username firstname lastname profilepic'
			})

		// TODO: cleanup followers
		console.log(followers)
		return followers
	} catch (err) {
		console.log(err)
		logger.error(err)
		// Return nothing if an error occurs
		return
	}
}

/** Route to follow another user.
 * @swagger
 * /connection/follow/{id}:
 *   post:
 *     summary: Request to allow current user to follow another by id
 *     tags:
 *       - connection
 *     description: Protected route. If not already following, allows user to follow another user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: id of the user to be followed
 *         required: true
 *         example: 507f1f77bcf86cd799439011
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow successful
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
 *                   example: [array of followees]
 *                   required: false
 *       204:
 *         description: Follow successful, but no data returned
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
 *                   example: "Request was successful but no data returned"
 *                   required: true
 *       400:
 *         description: Invalid request parameters in URL or in body
 *       500:
 *         description: Server error in contacting database
 *       403:
 *         description: The user cannot be followed, does not exist, is temporary or banned
 *       409:
 *         description: The user is already following this user. 
 */
router.post('/follow/:id', async (req, res) => {

	// validate the request body
	const { error } = idValidator.validate(req.params)
	if (error) {
		const obj = generateResponseMessage("error", error)
		console.log(obj)
		return res.status(400).json(obj)
	}

	// extract otp
	const { id } = req.params

	// extract the requester id
	const userId = req.userId // from the middleware checkJWT
	try {
		// check if followee id is a valid user
		const isUserActiveStatus = await isUserActive(userId)
		console.log({isUserActiveStatus})
		if (isUserActiveStatus !== 1) {
			const outputString = "The asker's account is " +
				((isUserActiveStatus == -1) ? "throwing a db error" :
				(isUserActiveStatus == -2) ? "not a valid id" :
					(isUserActiveStatus == 0) ? "not found with this id" :
						(isUserActiveStatus == 2) ? "is only temporarily registered" :
							(isUserActiveStatus == 3) ? "is banned" : `!! returning ${isUserActiveStatus}`)
			return res.status(403).json(generateResponseMessage("error", outputString))
		}

		// create the connection
		const connection = await Connection.create({ follower: id, following: userId })

		// get all followees for the user
		const followees = await _getFolloweesById(id)
		console.log({followees})
		if (followees) {
			// return updated followees as a success response
			res.status(200).json(generateResponseMessage("success", followees))
		} else {
			res.status(204).json(generateResponseMessage("success", "Request was successful but no data returned"))
		}
	} catch (err) {
		if (err.code === 11000) { // checking for unique constraint violation
			logger.error(err)
			return res.status(409).json(generateResponseMessage("error", "Already following"))
		} else {
			logger.error(err)
			console.error(err) // prints any other type of error
			return res.status(500).json(generateResponseMessage("error", err))
		}
	}
})



// // unfollow endpoint
// app.post('/users/unfollow/:id', async (req, res) => {
// 	try {
// 		const user = await User.findById(req.params.id)
// 		if (!user) {
// 			return res.status(404).json({ message: 'User not found' })
// 		}
// 		user.followers = user.followers.filter(follower => follower.toString() !== req.body.userId)
// 		await user.save()
// 		await Connection.deleteOne({ follower: req.params.id, following: req.body.userId })
// 		res.json({ message: 'User unfollowed successfully' })
// 	} catch (err) {
// 		console.error(err)
// 		res.status(500).json({ message: 'Server error' })
// 	}
// })

// // get followers endpoint
// app.get('/users/followers/:id', async (req, res) => {
// 	try {
// 		const user = await User.findById(req.params.id)
// 		if (!user) {
// 			return res.status(404).json({ message: 'User not found' })
// 		}
// 		const followers = await User.find({ _id: { $in: user.followers } })
// 		res.json(followers)
// 	} catch (err) {
// 		console.error(err)
// 		res.status(500).json({ message: 'Server error' })
// 	}
// })

// // get following endpoint
// app.get('/users/following/:id', async (req, res) => {
// 	try {
// 		const user = await User.findById(req.params.id)
// 		if (!user) {
// 			return res.status(404).json({ message: 'User not found' })
// 		}
// 		const following = await User.find({ _id: { $in: user.following } })
// 		res.json(following)
// 	} catch (err) {
// 		console.error(err)
// 		res.status(500).json({ message: 'Server error' })
// 	}
// })

// /**
//  * @param {Object} req - The HTTP request object (contains the follower and followee UUIDs)
//  * @param {Object} res - The HTTP response object.
//  */
// router.post('/create', async (req, res) => {

// 	// validate the request body
// 	const { error } = connectValidator.validate(req.body) // validate the request body
// 	if (error)
// 		return res.status(400).send(error.details[0].message) // send a clear error message if validation fails

// 	const userId = req.userId // from the middleware checkJWT
// 	const { followeeId } = req.body

// 	if (!followeeId) {
// 		return res.status(400).json(generateResponseMessage("error", "Missing required parameters"))
// 	}

// 	//check if the follower user exists
// 	const followerExists = await isUserActive(userId)

// 	if (followerExists !== 1) {
// 		const outputString =  "The asker's account is " +
// 			(followerExists == -1) ? "throwing a db error" :
// 			(followerExists == -2) ? "not a valid id" :
// 			(followerExists == 0) ? "not found with this id" :
// 			(followerExists == 2) ? "is only temporarily registered" :
// 			(followerExists == 3) ? "is banned" : `!! returning ${followerExists}`
// 		return res.status(403).json(generateResponseMessage("error", outputString))
// 	} 

// 	const followeeExists = await isUserActive(followeeId)

// 	if (followeeExists !== 1){
// 		const outputString =  "The target to follow's account is " +
// 			(followeeExists == -1) ? "throwing a db error" :
// 			(followeeExists == -2) ? "not a valid id" :
// 			(followeeExists == 0) ? "not found with this id" :
// 			(followeeExists == 2) ? "is only temporarily registered" :
// 			(followeeExists == 3) ? "is banned" : `!! returning ${followeeExists}`
// 		return res.status(403).json(generateResponseMessage("error", outputString))
// 	}

// 	try {
// 		const existingConnection = await Connection.find({ followee: followeeId, follower: userId })

// 		//check if the connection already exists
// 		if (existingConnection.length > 0) {
// 			return res.status(409).json(generateResponseMessage("error", "Connection already exists"))
// 		}

// 		//completing all the validations and creating the connection
// 		const connection = new Connection({ followee: followeeId, follower: userId })
// 		await connection.save()
// 		return res.status(200).json(generateResponseMessage("success", "Connection created successfully"))
// 	}
// 	catch (error) {
// 		logger.error(error)
// 		return res.status(500).json(generateResponseMessage("error", error))
// 	}
// })

// /**
//  * @param {Object} req - The HTTP request object (contains the follower and followee UUIDs)
//  * @param {Object} res - The HTTP response object.
//  */
// router.post('/remove', async (req, res) => {

// 	const { error } = connectValidator.validate(req.body) // validate the request body
// 	if (error)
// 		return res.status(400).send(error.details[0].message) // send a clear error message if validation fails

// 	const userId = req.userId // from the middleware checkJWT
// 	const { followeeId } = req.body

// 	//check for the case when null is passed as a parameter
// 	if (!followeeId) {
// 		return res.status(400).json(generateResponseMessage("error", "Missing required parameters"))
// 	}

// 	const followerExists = await isUserActive(userId)

// 	if (followerExists !== 1) {
// 		const outputString =  "The asker's account is " +
// 			(followerExists == -1) ? "throwing a db error" :
// 			(followerExists == -2) ? "not a valid id" :
// 			(followerExists == 0) ? "not found with this id" :
// 			(followerExists == 2) ? "is only temporarily registered" :
// 			(followerExists == 3) ? "is banned" : `!! returning ${followerExists}`
// 		return res.status(403).json(generateResponseMessage("error", outputString))
// 	} 

// 	const followeeExists = await isUserActive(followeeId)

// 	if (followeeExists !== 1){
// 		const outputString =  "The target to follow's account is " +
// 			(followeeExists == -1) ? "throwing a db error" :
// 			(followeeExists == -2) ? "not a valid id" :
// 			(followeeExists == 0) ? "not found with this id" :
// 			(followeeExists == 2) ? "is only temporarily registered" :
// 			(followeeExists == 3) ? "is banned" : `!! returning ${followeeExists}`
// 		return res.status(403).json(generateResponseMessage("error", outputString))
// 	}

// 	try {

// 		//check if the connection exists or not
// 		const existingConnection = await Connection.find({ followee: followeeId, follower: userId })
// 		if (existingConnection.length === 0) {
// 			return res.status(404).json(generateResponseMessage("error", "Connection does not exist"))
// 		}

// 		//completing all the validations and deleting the connection
// 		const deletedConnection = await Connection.deleteOne({ followee: followeeId, follower: userId })
// 		return res.status(200).json(generateResponseMessage("success", "Connection deleted successfully"))
// 	}
// 	catch (error) {
// 		logger.error(error)
// 		return res.status(500).json(generateResponseMessage("error", "Internal Server Error"))
// 	}
// })

module.exports = router