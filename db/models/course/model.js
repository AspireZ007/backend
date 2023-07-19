// Require Mongoose library
const mongoose = require("mongoose")

const REGISTRATIONSTATUS_CODES = {
	REQUESTED: 0,						// user sent request to join course
	ACCEPTED: 1,						// request was accepted into the course
	REJECTED: 2,						// request was rejected
	DISCONTINUED: 3,				// accepted but user discontinued
	COMPLETED: 4						// accepted and course completed
}

const FEEDBACKTYPE_CODES = {
	EPIC: 0,								// highest level, module or topic
	STORY: 1,								// second highest level, sub modules or topics
	TASK: 2									// individual topics
}

const MANAGERROLE_CODES = {
	INSTRUCTOR: 0,					// users who will "teach"
	TA: 1,									// users who will assist the "INSTRUCTOR"s
	COORDINATOR: 2,					// course administrators
	ASSESSOR: 3,						// users who assist in assigning grades or feedback
	AUDITOR: 4,							// users who just view all details	
	COLLEGE: 5,							// auditors representing an educational institution
	INDUSTRY: 6							// auditors representing an organization
}

const COURSESTATUS_CODES = {
	DRAFT: 0,								// just created, but not visible
	PUBLISHED: 1,						// visible to everyone and open to registrations
	ARCHIVED: 2,						// visible only to registered users
	FINISHED: 3,						// course has ended, not visible to anyone
}

const registrationSchema = new mongoose.Schema({

	user: 					{ type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
	state: 					{ type: Number, default: REGISTRATIONSTATUS_CODES.REQUESTED },

	requestedAt: 		{ type: Date, required: true, default: Date.now },
	acceptedAt: 		{ type: Date },
	rejectedAt: 		{ type: Date },
	discontinuedAt: { type: Date },

	feedback: [{
		type:				{ type: Number, required: true, default: FEEDBACKTYPE_CODES.TASK },
		details:		{ type: String, required: true },
		feedback:		{ type: String, required: true },
		createdBy:	{ type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
		timestamp: 	{ type: Date, default: Date.now, required: true },
		score:			{ type: Number, min: 0, max: 100, required: true}
	}],
})

const managerSchema = new mongoose.Schema({
	managerId: 		{ type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
	role: 				{ type: Number, required: true, default: MANAGERROLE_CODES.AUDITOR }
})

const materialSchema = new mongoose.Schema({
	url:					{ type: String, required: true },
	addedBy:			{ type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
	addedOn:			{ type: Date, required: true, default: Date.now },
	description:	{ type: String, required: true }
})

// Define the Course schema
const courseSchema = new mongoose.Schema({
	title: 					{ type: String, required: true, unique: true },
	subtitle: 			{ type: String, required: true },
	description: 		{ type: String, required: true },
	tags: 					[ { type: String, required: true } ],
	pic: 						{ type: String },
	startDate: 			{ type: Date },
	endDate: 				{ type: Date },

	createdBy:			{ type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
	creationDate:		{ type: Date, required: true, default: Date.now },

	managers: 			[ { type: managerSchema } ],
	material:				[ { type: materialSchema } ],
	registrations: 	[ registrationSchema ],

	rating: {
		upvotes: 		[ { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true } ],
		downvotes: 	[ { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true } ]
	},

	status:					{ type: Number, required: true, default: COURSESTATUS_CODES.DRAFT }
})

// Create the Course model based on the Course schema
const Course = mongoose.model("courses", courseSchema)

module.exports = { Course, FEEDBACKTYPE_CODES, REGISTRATIONSTATUS_CODES, MANAGERROLE_CODES }
