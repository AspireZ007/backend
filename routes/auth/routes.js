// External Import
const express = require('express');
const router = express.Router();

// JWT Token Dependency
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv")

// Email Helper
const { sendMail } = require('../../helpers/email');

// Database
const index = require("../../db/index");

const login = require('../../validation/login');
const signupValidation = require('../../validation/signup');

// Constants
const ERROR_CODES = require('../../constants/errorCodes');
const { loginValidator } = require('./validators');
const User = require('../../db/models/user/model');

// router.post('/forgotPassword', authController.forgotPassword);
// router.put('/resetPassword/:token', authController.resetPassword);


router.post("/login", async (req, res) => {

	const { error } = loginValidator.validate(req.body); // validate the request body
	if (error)
		return res.status(400).send(error.details[0].message); // send a clear error message if validation fails

	try {
		const { email, password } = req.body;
		// const user = await User.findOne({ email });
		// if (!user) {
		// 	return res.status(400).json({ message: 'Invalid Credentials' });
		// }
		// const match = await user.checkPassword(password)
		// if (!match) {
		// 	return res.status(400).json({ message: 'Invalid Credentials' });
		// }
		const token = jwt.sign({ userId: "appa" }, process.env.SECRET_KEY, {
			expiresIn: '1h'
		});
		res.json({ token });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Server Error' });
	}
});

/**
	* signup post request
	* @param {string} name
	* @param {string} email
	* @param {string} password
	* @param {string} phone_number
	* @param {string} username
	* @param {string} college
	* @param {string} confirm_password
	* @returns {json} status
*/
router.post("/signup", async (req, res) => {
	const payload = req.body;
	const { name, email, password, phone_number, username, college, confirm_password } = payload;
	signupValidation(payload).then((validation_result) => {
		if (validation_result == "200") {
			const hashedpassword = bcrypt.hashSync(password, SALT);
			const token = jwt.sign({ email: email, username: username }, SECRET_KEY);
			const b = token.split(".")[1];
			index.createUser(name, email, hashedpassword, phone_number, username, null, college, token).then((httpcode) => {
				if (httpcode == 201) {
					sendMail(token, req.body.email);
					res.status(201).json({ message: ERROR_CODES['201a'] });
				} else if (httpcode == 409) {
					res.status(409).json({ error: ERROR_CODES['409a'] });
				} else {
					res.status(500).json({ error: ERROR_CODES['500'] });
				}
			});
		}
		else {
			res.status(400).json({ error: ERROR_CODES[validation_result] })
		}
	});
});



/**
 * email verification get request
 * @param {string} token
 */
router.get("/verify/:token", async (req, res) => {
	const token = req.params.token;
	try {
		user = await index.getDetailsByToken(token);
		if (!user) res.status(400).json({ error: ERROR_CODES['400'] });
	}
	catch (err) {
		res.status(500).json({ message: ERROR_CODES['500'] });
	}
	const user_id = user.username;
	const b = token.split(".")[1];
	const decrpt = JSON.parse(Buffer.from(b, "base64").toString("ascii"));
	const recived_id = decrpt.username;

	//status of the user should be changed to verified
	if (user_id == recived_id) {
		res.status(201).send(ERROR_CODES['201b']);
	} else {
		res.status(400).json({ error: ERROR_CODES['400'] });
	}
});

module.exports = router;