/**
 * 
 * @param {String} email 
 * @returns {Boolean} true if email is valid or false otherwise
 * @description : Function to validate email format
 */
const isValidEmailFormat = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  module.exports = isValidEmailFormat;