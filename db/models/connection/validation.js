
const User = require('../user/model')
const logger = require("../../../helpers/logger")

/**
 * Asynchronously checks if a user exists in the database based on their UUID
 * @param {string} uuid - The uuid of the user to check for.
 * @returns {number} Returns 0 if the user is not found. Otherwise, returns:
 *                    -  1 if the uuid exists in the database and user's status is PERMANENT.
 *                    - -1 if an error occurs during the database query.
 *                    - -2 if more than 2 records found
 */
const checkIfUuidExists = async (uuid) => {
    try{
        // fetching users with the received UUID
        const user = await User.find({ _id: uuid, status: 1})

        // if no user exists
        if(user.length === 0){
            return 0
        }

        // if single record exists
        else if(user.length === 1){
            return 1
        }

        // database constraints are voilated
        else{
            return -2
        }
    }
    catch(error) {
        logger.error(error)
        return -1
    }
}

module.exports.checkIfUuidExists = checkIfUuidExists;