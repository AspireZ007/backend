const express = require('express');
const router = express.Router();
const emailValidator = require('deep-email-validator');

// Pre-declared array of usernames
const usernames = ['john_doe', 'jane_smith', 'test_user'];

// Middleware function for response validation
const validateResponse = async (req, res, next) => {
  const { username, email, password, college, name } = req.body;

  // Check if username is filled
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  // Check if email is filled
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Check if password is filled
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  // Check if college is filled
  if (!college) {
    return res.status(400).json({ error: 'College is required.' });
  }

  // Check if name is filled
  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  // Validate username
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Invalid username. It should be 4-30 characters long, alphanumeric, and contain an underscore.' });
  }

  // Validate email
  try {
    const emailValidation = await isEmailValid(email);
    if (!emailValidation.valid) {
      const errorMsgs = getEmailValidationErrors(emailValidation);
      return res.status(400).json({ error: errorMsgs });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Email validation failed.' });
  }

  // Validate password
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Invalid password. It should be alphanumeric with special characters.' });
  }

  // Validate college
  if (!isValidCollege(college)) {
    return res.status(400).json({ error: 'Invalid college. It should be alphanumeric.' });
  }

  // Validate name
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Invalid name. It should be 6-50 characters long and contain alphabets only.' });
  }

  // If all constraints are satisfied, move to the next middleware or route handler
  next();
};

// Function to validate username
const isValidUsername = (username) => {
  const minLength = 4;
  const maxLength = 30;
  const regex = /^[a-zA-Z0-9_]+$/;

  if (username.length < minLength || username.length > maxLength || !regex.test(username)) {
    return false;
  }

  // Check if username already exists
  if (usernames.includes(username)) {
    return false;
  }

  return true;
};

// Function to validate password complexity
const isValidPassword = (password) => {
  const regex = /^.(?=.\d)(?=.[a-zA-Z])(?=.[@#$%^&+=]).*$/;

  return regex.test(password);
};

// Function to validate college (alphanumeric)
const isValidCollege = (college) => {
  const regex = /^[a-zA-Z0-9]+$/;

  return regex.test(college);
};

// Function to validate name (alphabets)
const isValidName = (name) => {
  const minLength = 6;
  const maxLength = 50;
  const regex = /^[a-zA-Z]+$/;

  return name.length >= minLength && name.length <= maxLength && regex.test(name);
};

// Function to validate email using deep-email-validator
async function isEmailValid(email) {
  try {
    const result = await emailValidator.validate(email)
    return result;
  } catch (error) {
    throw new Error('Email validation failed.');
  }
}

// Function to get error messages from email validation result
const getEmailValidationErrors = (validationResult) => {
  const errors = validationResult.reasons.map((reason) => reason.error);

  return errors;
};

// Add the validateResponse middleware to the desired route
router.post('/register', validateResponse, (req, res) => {


  // Return success response
  res.status(200).json({ message: 'Registration successful.' });
});

// Export the router
module.exports = router;