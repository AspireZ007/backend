const emailFormatValidator = require('./utilities/emailformatvalidator');
const nameFormatValidator = require('./utilities/nameformatvalidator');
const passwordFormatValidator = require('./utilities/passwordformatvalidator');
const usernameFormatValidator = require('./utilities/usernameformatvalidator');
const collegeNameFormatValidator = require('./utilities/collegenameformatvalidator');
const checkExistance = require('../Database/index').checkExistance;


async function signupValidation(credentials){
    const {name , email , password , confirm_password , phone_number , username , college} = credentials;
    if(!name || !email || !password || !confirm_password || !phone_number || !username || !college) 
        return "400";
    if(password !== confirm_password)
        return "401";
    if(emailFormatValidator(email)) return "400a";
    if(nameFormatValidator(name)) return "400c";
    if(collegeNameFormatValidator(college)) return "400e";
    if(usernameFormatValidator(name)) return "400d";
    if(checkExistance({username : username})) return "409b";
    if(checkExistance({email : email})) return "409a";
    return "200";    
}

module.exports = signupValidation;