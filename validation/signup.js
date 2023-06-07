const emailFormatValidator = require('./utilities/emailformatvalidator');
const nameFormatValidator = require('./utilities/nameformatvalidator');
const passwordFormatValidator = require('./utilities/passwordformatvalidator');
const usernameFormatValidator = require('./utilities/usernameformatvalidator');
const collegeNameFormatValidator = require('./utilities/collegenameformatvalidator');
const checkExistance = require('../db/index').checkExistance;

/**

Validates the signup credentials provided by the user.

@param {Object} credentials - The signup credentials provided by the user.

@param {string} credentials.name - The name provided by the user.

@param {string} credentials.email - The email address provided by the user.

@param {string} credentials.password - The password provided by the user.

@param {string} credentials.confirm_password - The confirmed password provided by the user.

@param {string} credentials.phone_number - The phone number provided by the user.

@param {string} credentials.username - The username provided by the user.

@param {string} credentials.college - The college name provided by the user.

@returns {string} - The HTTP status code indicating the result of the signup validation.

Output:
Returns an HTTP status code as a string, indicating the result of the signup validation.
Possible values:

"200" - Successful signup.
"400z" - One or more required fields are missing.
"401" - Password and confirm_password do not match.
"400b" - Invalid password format.
"400a" - Invalid email format.
"400c" - Invalid name format.
"400d" - Invalid username format.
"400e" - Invalid college name format.
"409a" - Email already exists in the database.
"409b" - Username already exists in the database.
Purpose:

This function validates the provided signup credentials using format validators,

checks the existence of email and username in the database, and returns an appropriate

HTTP status code indicating the result of the validation process.
*/

async function signupValidation(credentials){
    const {name , email , password , confirm_password , phone_number , username , college} = credentials;
    if(!name || !email || !password || !confirm_password || !phone_number || !username || !college) 
        return "400z";
    if(password !== confirm_password)
        return "401";
    if(!passwordFormatValidator(password)) return "400b";
    if(!emailFormatValidator(email)) return "400a";
    if(!nameFormatValidator(name)) return "400c";
    if(!collegeNameFormatValidator(college)) return "400e";
    if(!usernameFormatValidator(username)) return "400d";
    if(!checkExistance({username : username})) return "409b";
    if(!checkExistance({email : email})) return "409a";
    return "200";    
}

module.exports = signupValidation;