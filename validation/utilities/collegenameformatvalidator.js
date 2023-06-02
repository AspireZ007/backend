// Function to validate college (alphanumeric)
const isValidCollege = (college) => {
    const regex = /^[a-zA-Z0-9\s]+$/;
    return regex.test(college);
  };
  
  module.exports = isValidCollege;
  ``
  //return res.status(400).json({ error: 'Invalid college. It should be alphanumeric.' });