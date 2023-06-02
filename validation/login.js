const server = require('../Database/index');
const passwordValidator = require('./utilities/passwordformatvalidator');
const emailValidator = require('./utilities/emailformatvalidator');
async function loginValidation(email, password) {
    // const {email , password} = credentials;
    email = email.trim();
    password = password.trim();
    if (!email || !password)
        return "400";
    if (!emailValidator(email))
        return "400a";
    if (!passwordValidator(password))
        return "400b";
    const user = await server.getLoginStatus(email);
    if (user === -1) {
        return 404;
    }
    else if (user === -2) {
        return 401;
    }
    else {
        return 200;
    }
}

module.exports = loginValidation;