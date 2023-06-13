require("dotenv").config();
const jwt = require('jsonwebtoken');
const { generateResponseMessage } = require("./response");

/**
 * Express middleware that checks for the validity of a JWT token and returns the user role.
 *
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 * @param {Function} next The next middleware function in the chain.
 *
 * @throws {Error} If the JWT token is missing or invalid
 */
const checkJwt = (req, res, next) => {
  // Get the JWT token from the Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const token = authHeader.slice(7)

  try {
    // Verify the JWT token
    const { _id } = jwt.verify(token, process.env.SECRET_KEY)
    req.userId = _id
    return next()
  } catch (err) {
    console.error(err)
    return res.status(401).json(generateResponseMessage("error", err))
  }
}

module.exports = { checkJwt }
