/**
 * 
 * @param {String} password 
 * @returns {Boolean} true if password is valid and false otherwise
 * @description : Function to validate the password format
 */
const isValidPassword = (password) => {
    const regex = /^.*(?=.*\d)(?=.*[a-zA-Z])(?=.*[@#$%^&+=]).*$/;
    return regex.test(password);
  };
  
  module.exports = isValidPassword;