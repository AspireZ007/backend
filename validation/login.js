const server = require('../Database/index');
const passwordValidator = require('./utilities/passwordformatvalidator');
const emailValidator = require('./utilities/emailformatvalidator');


/**

Validates the login credentials provided by the user.
@param {string} email - The email address provided by the user.
@param {string} password - The password provided by the user.
@returns {string} - The HTTP status code indicating the result of the login validation.

Output:
Returns an HTTP status code as a string, indicating the result of the login validation.
Possible values:
"200" - Successful login.
"400z" - Invalid email or password format (empty or whitespace only).
"400a" - Invalid email format.
"400b" - Invalid password format.
"404" - User not found.
"401" - Incorrect password.
Purpose:
This function validates the provided email and password using format validators,
checks the login status against the database server, and returns an appropriate
HTTP status code indicating the result of the validation process.
*/


async function loginValidation(email, password) {
    // const {email , password} = credentials;
    if (!email || !password)
    return "400z";
    email = email.trim();
    password = password.trim();
    if (!email || !password)
    return "400z";
    if (!emailValidator(email))
        return "400a";
    if (!passwordValidator(password))
        return "400b";
    const user = await server.getLoginStatus(email , password);
    if (user === -1) {
        return "404";
    }
    else if (user === -2) {
        return "401";
    }
    else {
        return "200";
    }
}

module.exports = loginValidation;