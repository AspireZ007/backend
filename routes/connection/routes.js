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

/** Helper function, retrieves a list of followees for a given follower ID.
 * @async
 * @function
 * @name _getFolloweesById
 * @param {string} followerId - The ID of the follower to retrieve followees for.
 * @returns {Promise<Array>} - A promise that resolves to an array of followee documents or undefined in case of error.
 */
const _getFolloweesById = async (followerId) => {
	try {

		const followees = await Connection.find({ follower: followerId, isBlocked: CONNECTIONSTATUS_CODES.ALLOWED, isUnfollowed: CONNECTIONSTATUS_CODES.ALLOWED }, 'following')
			.populate({
				path: 'following',																	// populate the reference
				select: 'username firstname lastname profilepic',		// select only what we need
				transform: (doc, id) => { 													// replace _id with id
					if (doc == null) {
						return id
					} else {
						const ret = { ...doc._doc }
						ret.id = ret._id
						delete ret._id
						return ret
					}
				}
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

/** Helper function, retrieves a list of followers for a given follower ID.
 * @async
 * @function
 * @name _getFollowersById
 * @param {string} followeeId - The ID of the follower to retrieve followees for.
 * @returns {Promise<Array>} - A promise that resolves to an array of followee documents or undefined in case of error.
 */
const _getFollowersById = async (followeeId) => {
	try {

		const followers = await Connection.find({ following: followeeId, isBlocked: CONNECTIONSTATUS_CODES.ALLOWED, isUnfollowed: CONNECTIONSTATUS_CODES.ALLOWED }, 'following')
			.populate({
				path: 'follower',																		// populate the reference
				select: 'username firstname lastname profilepic',		// select only what we need
				transform: (doc, id) => { 													// replace _id with id
					if (doc == null) {
						return id
					} else {
						const ret = { ...doc._doc }
						ret.id = ret._id
						delete ret._id
						return ret
					}
				}
			})

		const responseObj = followers.map((connectionObject => connectionObject.follower))
		return responseObj
	} catch (err) {
		console.log(err)
		logger.error(err)
		// Return nothing if an error occurs
		return
	}
}

/** Route to get the list of all followers, the people following current user
 * @swagger
 * /connection/followers:
 *   get:
 *     summary: Request to allow current user to get all people that follow them
 *     tags:
 *       - connection
 *     description: Protected route. Gets the list of all followers, the people following current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of followers queries and returned
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
 *                   example: [array of followers]
 *                   required: false
 *       500:
 *         description: Server error in contacting database
 *       204:
 *         description: Same as 200 but no data returned
 */
router.get('/followers', async (req, res) => {

	// get the requester id, extracted by the middleware checkJWT
	const userId = req.userId

	try {
		// get all followees for the user
		const followers = await _getFollowersById(userId)

		if (followers) {
			res.status(200).json(generateResponseMessage("success", followers))
		} else {
			res.status(204).json(generateResponseMessage("success", "Request was successful but no data returned"))
		}
	} catch (err) {
		logger.error(err)
		console.error(err) // prints any other type of error
		return res.status(500).json(generateResponseMessage("error", err))
	}
})

/** Route to get the list of all followees, the people current user follows
 * @swagger
 * /connection/followees:
 *   get:
 *     summary: Request to allow current user to get all people they follow
 *     tags:
 *       - connection
 *     description: Protected route. Gets the list of all followees, the people current user follows.
 *     security:
 *       - bearerAuth: []
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
 *       500:
 *         description: Server error in contacting database
 *       204:
 *         description: Same as 200 but no data returned
 */
router.get('/followees', async (req, res) => {

	// get the requester id, extracted by the middleware checkJWT
	const userId = req.userId

	try {
		// get all followees for the user
		const followees = await _getFolloweesById(userId)

		if (followees) {
			res.status(200).json(generateResponseMessage("success", followees))
		} else {
			res.status(204).json(generateResponseMessage("success", "Request was successful but no data returned"))
		}
	} catch (err) {
		logger.error(err)
		console.error(err) // prints any other type of error
		return res.status(500).json(generateResponseMessage("error", err))
	}
})

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
 *         example: 648e0f25888c1f49d7184fb5
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
 *         description: The user is already following this user
 *       412:
 *         description: pre-condition failed, user cannot follow himself
 */
router.post('/follow/:id', async (req, res) => {

	// validate the request body
	const { error } = idValidator.validate(req.params)
	if (error) {
		const obj = generateResponseMessage("error", error)
		console.log(obj)
		return res.status(400).json(obj)
	}

	// extract path
	const { id } = req.params

	// extract the requester id
	const userId = req.userId // from the middleware checkJWT

	if (id.trim() === userId.trim()) {
		return res.status(412).json(generateResponseMessage("error", "User cannot follow himself."))
	}

	try {
		// check if followee id is a valid user
		const isUserActiveStatus = await isUserActive(id)
		console.log({ isUserActiveStatus })
		if (isUserActiveStatus !== 1) {
			const outputString = "The asker's account is " +
				((isUserActiveStatus == -1) ? "throwing a db error" :
					(isUserActiveStatus == -2) ? "not a valid id" :
						(isUserActiveStatus == 0) ? "not found with this id" :
							(isUserActiveStatus == 2) ? "is only temporarily registered" :
								(isUserActiveStatus == 3) ? "is banned" : `!! returning ${isUserActiveStatus}`)
			return res.status(403).json(generateResponseMessage("error", outputString))
		}

		// create the connection if it does not exist
		const updateOneStatus = await Connection.updateOne(
			{ follower: userId, following: id, isUnfollowed: CONNECTIONSTATUS_CODES.ALLOWED, isBlocked: CONNECTIONSTATUS_CODES.ALLOWED },
			{ $set: { follower: userId, following: id } },
			{ upsert: true })

		// get all followees for the user
		const followees = await _getFolloweesById(userId)

		if (followees) {
			if (updateOneStatus.upsertedCount == 0) { // case where user is already following
				return res.status(409).json(generateResponseMessage("error", followees))
			} else {
				// rcase where user 
				res.status(200).json(generateResponseMessage("success", followees))
			}
		} else {
			res.status(204).json(generateResponseMessage("success", "Request was successful but no data returned"))
		}
	} catch (err) {
		logger.error(err)
		console.error(err) // prints any other type of error
		return res.status(500).json(generateResponseMessage("error", err))
	}
})

/** Route to unfollow another user.
 * @swagger
 * /connection/unfollow/{id}:
 *   post:
 *     summary: Request to allow current user to unfollow another by id
 *     tags:
 *       - connection
 *     description: Protected route. If already following, allows user to unfollow another user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: id of the user to be unfollowed
 *         required: true
 *         example: 648e0f25888c1f49d7184fb5
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfollow successful
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
 *         description: Unfollow successful, but no data returned
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
 *         description: The user cannot be unfollowed, does not exist, is temporary or banned
 *       424:
 *         description: The user is not following, so cant unfollow.
 *       412:
 *         description: pre-condition failed, user cannot follow himself
 */
router.post('/unfollow/:id', async (req, res) => {

	// validate the request body
	const { error } = idValidator.validate(req.params)
	if (error) {
		const obj = generateResponseMessage("error", error)
		console.log(obj)
		return res.status(400).json(obj)
	}

	// extract path
	const { id } = req.params

	// extract the requester id
	const userId = req.userId // from the middleware checkJWT

	if (id.trim() === userId.trim()) {
		return res.status(412).json(generateResponseMessage("error", "User cannot unfollow himself."))
	}

	try {
		// check if followee id is a valid user
		const isUserActiveStatus = await isUserActive(id)
		console.log({ isUserActiveStatus })
		if (isUserActiveStatus !== 1) {
			const outputString = "The asker's account is " +
				((isUserActiveStatus == -1) ? "throwing a db error" :
					(isUserActiveStatus == -2) ? "not a valid id" :
						(isUserActiveStatus == 0) ? "not found with this id" :
							(isUserActiveStatus == 2) ? "is only temporarily registered" :
								(isUserActiveStatus == 3) ? "is banned" : `!! returning ${isUserActiveStatus}`)
			return res.status(403).json(generateResponseMessage("error", outputString))
		}

		// check if a valid follow exists
		const findFollowResults = await Connection.find(
			{ follower: userId, following: id, isUnfollowed: CONNECTIONSTATUS_CODES.ALLOWED, isBlocked: CONNECTIONSTATUS_CODES.ALLOWED })
		
		if (findFollowResults.length === 0) {
			// not following, so cannot unfollow
			res.status(424).json(generateResponseMessage("error", `User:${userId} does not follow User:${id}, so cannot unfollow`))
		} else {
			const connectionObj = findFollowResults[0]
			connectionObj.isUnfollowed = CONNECTIONSTATUS_CODES.BLOCKED
			connectionObj.unfollowedTime = new Date(Date.now())
			await connectionObj.save()

			// get all followees for the user
			const followees = await _getFolloweesById(userId)

			if (followees) {
				res.status(200).json(generateResponseMessage("success", followees))
			} else {
				res.status(204).json(generateResponseMessage("success", "Request was successful but no data returned"))
			}
		}
	} catch (err) {
		logger.error(err)
		console.error(err) // prints any other type of error
		return res.status(500).json(generateResponseMessage("error", err))
	}
})

module.exports = router