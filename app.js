// Dependencies Import
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")

// Environment Variables
const dotenv = require("dotenv")

// Logger Import
const logger = require("./helpers/logger")

// Routes Import
const authRoutes = require("./routes/auth/routes")

// Creating Express App
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// setting up routes
app.use('/auth', authRoutes)

// starting server
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		console.log("Database connection successful, now attempting to start server.")
		try {
			const server = app.listen(process.env.PORT, () => {
				console.log('Server running on port ' + process.env.PORT)
				logger.info('Server running on port ' + process.env.PORT)
			})

			// Handle any unhandled promise rejections
			process.on('unhandledRejection', (err) => {
				console.error(`Unhandled promise rejection: ${err}`)
				logger.error(`Unhandled promise rejection: ${err}`)
				server.close(() => {
					process.exit(1)
				})
			})

			// Handle any uncaught exceptions
			process.on('uncaughtException', (err) => {
				console.error(`Uncaught exception: ${err}`)
				logger.error(`Uncaught exception: ${err}`)
				server.close(() => {
					process.exit(1)
				})
			})
		} catch (error) {
			console.error(`Error starting server: ${error}`)
			logger.error(`Error starting server: ${error}`)
			process.exit(1)
		}
	})
	.catch((err) => {
		console.log('MongoDB connection error: ', err)
		logger.error(err)
	})
