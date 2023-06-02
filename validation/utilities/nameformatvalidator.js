// Function to validate name (alphabets)
module.exports = nameformatvalidator = (name) => {
    const minLength = 4;
    const maxLength = 50;
    const regex = /^[a-zA-Z\s]+$/;
  
    return name.length >= minLength && name.length <= maxLength && regex.test(name);
  };


  //return res.status(400).json({ error: 'Invalid name. It should be 4-50 characters long and contain alphabets only.' });