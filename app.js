// External Dependencies
const express = require("express")
const bodyParser = require("body-parser")

// Environment Variables and Logger
const dotenv = require("dotenv")
const logger = require("./helpers/logger")

// Setting up Swagger Docs
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const swaggerOptions = require("./helpers/swagger")
const swaggerSpec = swaggerJSDoc(swaggerOptions)

// Importing Routes
const authRoutes = require("./routes/auth/routes")

// DB Helper
const { connectToDatabase } = require("./helpers/db")

// Creating Express App
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Setting up routes
app.use('/auth', authRoutes)

const dbConnectionSuccess = connectToDatabase()
if (dbConnectionSuccess) {
	const server = app.listen(process.env.PORT, () => {
		console.log('Server running on port ' + process.env.PORT)
		logger.info('Server running on port ' + process.env.PORT)
	})

	server.on('error', (err) => {
		console.log('Server error:', err);
		logger.info('Server error:', err);
		process.exit(1)
	})
}