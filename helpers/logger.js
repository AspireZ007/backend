const winston = require('winston');
require("dotenv").config();
const moment = require('moment');
const logFilePath = process.env.LOG_FILE_PATH;

function logger() {
	const loggerObject = winston.createLogger({
		level: 'info',
		format: winston.format.combine(
			winston.format.timestamp({ format: () => moment().format('YYYY-MM-DD HH:mm:ss') }), // Add a timestamp to the log message
			winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
		),
		transports: [
			new winston.transports.File({ filename: logFilePath })
		]
	});
	return loggerObject;
}

module.exports = logger();