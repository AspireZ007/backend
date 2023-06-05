/**
 * 
 * @param {String} collegeName 
 * @returns {Boolean} Returns true if the College is valid or false otherwise
 * @description : Function to validate college Name
 */
const isValidCollege = (collegeName) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    return regex.test(collegeName);
  };
  
  module.exports = isValidCollege;