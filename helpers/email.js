const nodemailer = require('nodemailer');

// Config
require("dotenv").config();
const SMTP_HOST = process.env.SMTP_HOST;

/**
 * 
 * @param {string} token 
 * @param {string} reciver 
 */
const sendMail = (token, reciver) => {
	const transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		secureConnection: false,
		port: 587,
		tls: {
			ciphers: "SSLv3",
		},
		auth: {
			user: "aspirezofficial@outlook.com",
			pass: "aspirez007",
		},
	});

	let message = `Hi! There, You have recently visited
  our website and entered your email.
  Please follow the given link to verify your email
  http://localhost:3000/verify/${token}
  Thanks`;
	var mailOptions = {
		from: "aspirezofficial@outlook.com", // sender address (who sends)
		to: reciver, // list of receivers (who receives)
		subject: "Email Verification", // Subject line
		text: message, // plaintext body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			logger.error(error);
			return;
		}

		logger.info("Verification mail sent: " + info.response);
	});
};

module.exports = { sendMail }