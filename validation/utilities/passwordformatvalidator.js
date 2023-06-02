// Function to validate password complexity
const isValidPassword = (password) => {
    const regex = /^.*(?=.*\d)(?=.*[a-zA-Z])(?=.*[@#$%^&+=]).*$/;
    return regex.test(password);
  };
  
  module.exports = isValidPassword;
  
  //return res.status(400).json({ error: 'Invalid password. It should be alphanumeric with special characters.' });