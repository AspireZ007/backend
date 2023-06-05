/**
 * 
 * @param {String} name 
 * @returns {Boolean} true if the name is valid or false otherwise
 * @description : Function to validate the user's Name format
 */
const nameformatvalidator = (name) => {
    const minLength = 4;
    const maxLength = 50;
    const regex = /^[a-zA-Z\s]+$/;
  
    return name.length >= minLength && name.length <= maxLength && regex.test(name);
  };

  module.exports = nameformatvalidator;
