// Function to validate email format
const isValidEmailFormat = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  module.exports = isValidEmailFormat;
  
  //return res.status(400).json({ error: 'Invalid email format. Please provide a valid email address.' });