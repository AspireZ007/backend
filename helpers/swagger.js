const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'My API',
			version: '1.0.0',
			description: 'API documentation'
		},
		servers: [
			{
				url: 'http://localhost:3000'
			}
		]
	},
	apis: ['./routes/*.js']
};

module.exports = swaggerOptions