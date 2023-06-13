// External Import
const express = require('express')
const logger = require("../../helpers/logger.js")

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

    //check for the case when null is passed as a parameter
    if(!followerId || !followingId){
        return res.status(400).json(generateResponseMessage("error" ,"Missing required parameters"))
    }

    //chech if the follower user exists
    const followerExists = await checkIfUuidExists(followerId)
    if(followerExists === 0){
        return res.status(404).json(generateResponseMessage("error" ,"Follower user does not exist"))
    }
    else if(followerExists === -1){
        return res.status(500).json(generateResponseMessage("error" ,"Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("error" ,"Database constraints violated"))
    }

    //check if the following user exists
    const followingExists = await checkIfUuidExists(followingId)
    if(followingExists === 0){
        return res.status(404).json(generateResponseMessage("error" ,"Following user does not exist"))
    }
    else if(followingExists === -1){
        return res.status(500).json(generateResponseMessage("error" ,"Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("error" ,"Database constraints violated"))
    }

    try{
        const existingConnection = await Connection.find({ following : followingId, follower : followerId })

        //check if the connection already exists
        if(existingConnection.length > 0){
            return res.status(404).json(generateResponseMessage("error" , "Connection already exists"))
        }

        //completing all the validations and creating the connection
        const connection = new Connection({ following : followingId, follower : followerId })
        await connection.save()
        return res.status(200).json(generateResponseMessage("success" , "Connection created successfully"))
    }
    catch(error){
        logger.error(error)
        return res.status(500).json(generateResponseMessage("error" ,"Internal Server Error"))
    }  
})

/**
 * @param {Object} req - The HTTP request object (contains the follower and following UUIDs)
 * @param {Object} res - The HTTP response object.
 */
router.post('/remove', async (req, res) => {

    // unpacking the follower and following UUIDs from the request body
    const { followerId , followingId } = req.body

    //check for the case when null is passed as a parameter
    if(!followerId || !followingId){
        return res.status(400).json(generateResponseMessage("error" ,"Missing required parameters"))
    }

    //chech if the follower user exists
    const followerExists = await checkIfUuidExists(followerId)
    if(followerExists === 0){
        return res.status(404).json(generateResponseMessage("error" ,"Follower user does not exist"))
    }
    else if(followerExists === -1){
        return res.status(500).json(generateResponseMessage("error" ,"Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("error" ,"Database constraints violated"))
    }

    //check if the following user exists
    const followingExists = await checkIfUuidExists(followingId)
    if(followingExists === 0){
        return res.status(404).json(generateResponseMessage("error" ,"Following user does not exist"))
    }
    else if(followingExists === -1){
        return res.status(500).json(generateResponseMessage("error" ,"Internal Server Error"))
    }
    else if(followerExists === -2){
        return res.status(500).json(generateResponseMessage("error" ,"Database constraints violated"))
    }

    try{

        //check if the connection exists or not
        const existingConnection = await Connection.find({ following : followingId, follower : followerId })
        if(existingConnection.length === 0){
            return res.status(404).json(generateResponseMessage("error" ,"Connection does not exist"))
        }
        else if(existingConnection.length > 1){
            return res.status(500).json(generateResponseMessage("error" ,"Database constraints violated"))
        }
        
        //completing all the validations and deleting the connection
        const deletedConnection = await Connection.deleteOne({ following : followingId, follower : followerId })
        return res.status(200).json(generateResponseMessage("success" ,"Connection deleted successfully", deletedConnection))
    }
    catch(error){
        logger.error(error)
        return res.status(500).json(generateResponseMessage("error" ,"Internal Server Error"))
    }    
})

module.exports = router