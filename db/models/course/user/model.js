const mongoose = require("mongoose")

const USERSTATUS_CODES = {
	TEMPORARY: 0,
	PERMANENT: 1,
	BANNED: -1
}

const USERROLE_CODES = {
	REGULAR: 0,
	SUPERADMIN: 1
}

// Require Mongoose library
const mongoose = require('mongoose');

// Define the Registration schema
const registrationSchema = new mongoose.Schema({
	// references to registered users from User model
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, required: true, default: Date.now },
  state: { type: String, enum: ['requested', 'accepted', 'rejected', 'discontinued', 'completed'], default: 'requested'
  },
  feedback: [{
    body: { // feedback body
      type: String,
    },
    createdBy: { // reference to user who created the feedback
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { // date when feedback was created
      type: Date,
      default: Date.now
    }
  }]
});

// Define the Course schema
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    required: true
  }],
  imageUrl: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  teachers: [{ // references to teachers from User model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  registrations: [registrationSchema],
  rating: {
    upvotes: [{ // upvotes given by users
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{ // downvotes given by users
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
});

// Create the Course model based on the Course schema
const Course = mongoose.model('Course', courseSchema);

// Export the Course model
module.exports = Course;

const userSchema = new mongoose.Schema({

	firstname: 	{ type: String, required: true },
	lastname: 	{ type: String, required: true },
	email: 			{ type: String, required: true, unique: true },
	password: 	{ type: String, required: true },
	phone: 			{ type: String, required: true },
	username: 	{ type: String, required: true, unique: true },
	college: 		{ type: String, required: true },
	profilepic:	{ type: String, unique: true, default: "" },

	interests: 	{ type: [String], required: true, default: [] },

	status: 		{ type: Number, required: true, default: USERSTATUS_CODES.TEMPORARY },
	role: 			{ type: Number, required: true, default: USERROLE_CODES.REGULAR },

	otp: 				{ type: String },
	resetOtp: 	{ type: String },

	createdAt: 	{ type: Date, required: true, default: Date.now },
})

const User = mongoose.model("users", userSchema)

module.exports = User
module.exports.USERSTATUS_CODES = USERSTATUS_CODES
module.exports.USERROLE_CODES = USERROLE_CODES
