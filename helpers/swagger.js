const swaggerOptions = {
	definition: {
		openapi: "3.0.1",
		info: {
			title: "LogRocket Express API with Swagger",
			version: "0.1.0",
			description:
				"This is the API documentation of AspireZ application implementing a professional social network.",
			contact: {
				name: "Puran B Kalapala",
				url: "http://www.aspireinfolabs.com",
				email: "puran.k@aspireinfolabs.com",
			},
		},
		servers: [
			{
				url: "http://localhost:8000",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			}
		}
	},
	apis: ["./routes/*/routes.js"],
}

module.exports = swaggerOptions