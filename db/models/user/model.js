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

const userSchema = new mongoose.Schema({
  firstName: 		{ type: String, required: true },
  lastName: 		{ type: String, required: true },
  email: 				{ type: String, required: true, unique: true },
  password: 		{ type: String, required: true },
  phone_number: { type: String, required: true },
  status: 			{ type: Number, required: true, default: USERSTATUS_CODES.TEMPORARY },
  role: 				{ type: Number, required: true, default: USERROLE_CODES.REGULAR },
  username: 		{ type: String, required: true, unique: true },
  interests: 		{ type: [String], required: true, default: [] },
  college: 			{ type: String, required: true },
  token: 				{ type: String, required: true }
})

const User = mongoose.model("users", userSchema)

module.exports = User
module.exports.USERSTATUS_CODES = USERSTATUS_CODES
module.exports.USERROLE_CODES = USERROLE_CODES