// External Import
const express = require('express')
const logger = require("../../helpers/logger")

// Instantiating the router object
const router = express.Router()

const { generateResponseMessage } = require('../../helpers/response')

// Database
const Connection = require('../../db/models/connection/model')

const checkIfUuidExists = require('../../db/models/connection/validation').checkIfUuidExists

/**
 * @param {Object} req - The HTTP request object (contains the follower and following UUIDs)
 * @param {Object} res - The HTTP response object.
 */
router.post('/create', async (req, res) => {

    const { followerId , followingId } = req.body

    const followerExists = await checkIfUuidExists(followerId)
    if(followerExists === 0){
        return res.status(404).json(generateResponseMessage("Follower user does not exist"))
    }
    else if(followerExists === -1){
        return res.status(500).json(generateResponseMessage("Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("Database constraints violated"))
    }

    const followingExists = await checkIfUuidExists(followingId)
    if(followingExists === 0){
        return res.status(404).json(generateResponseMessage("Following user does not exist"))
    }
    else if(followingExists === -1){
        return res.status(500).json(generateResponseMessage("Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("Database constraints violated"))
    }

    const connection = new Connection({ following : followingId, follower : followerId })

    try{
        const savedConnection = await connection.save()
        return res.status(200).json(generateResponseMessage("Connection created successfully", savedConnection))
    }
    catch(error){
        logger.error(error)
        return res.status(500).json(generateResponseMessage("Internal Server Error"))
    }
        
})

/**
 * @param {Object} req - The HTTP request object (contains the follower and following UUIDs)
 * @param {Object} res - The HTTP response object.
 */
router.post('/remove', async (req, res) => {

    const { followerId , followingId } = req.body

    const followerExists = await checkIfUuidExists(followerId)
    if(followerExists === 0){
        return res.status(404).json(generateResponseMessage("Follower user does not exist"))
    }
    else if(followerExists === -1){
        return res.status(500).json(generateResponseMessage("Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("Database constraints violated"))
    }

    const followingExists = await checkIfUuidExists(followingId)
    if(followingExists === 0){
        return res.status(404).json(generateResponseMessage("Following user does not exist"))
    }
    else if(followingExists === -1){
        return res.status(500).json(generateResponseMessage("Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("Database constraints violated"))
    }

    try{
        const existingConnection = await Connection.find({ following : followingId, follower : followerId })
        if(existingConnection.length === 0){
            return res.status(404).json(generateResponseMessage("Connection does not exist"))
        }
        else if(existingConnection.length > 1){
            return res.status(500).json(generateResponseMessage("Database constraints violated"))
        }
        
        const deletedConnection = await Connection.deleteOne({ following : followingId, follower : followerId })
        return res.status(200).json(generateResponseMessage("Connection deleted successfully", deletedConnection))
    }
    catch(error){
        logger.error(error)
        return res.status(500).json(generateResponseMessage("Internal Server Error"))
    }    
})