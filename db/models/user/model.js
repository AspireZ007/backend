const mongoose = require("mongoose");

const USERSTATUS_CODES = {
  TEMPORARY: 0,
  PERMANENT: 1,
  BANNED: -1,
};

const USERROLE_CODES = {
  REGULAR: 0,
  SUPERADMIN: 1,
};

const userSchema = new mongoose.Schema({

  firstname: 				{ type: String, required: true },
  lastname: 				{ type: String, required: true },
  email: 						{ type: String, required: true, unique: true },
  password: 				{ type: String, required: true },
  phone: 						{ type: String, required: true },
  username: 				{ type: String, required: true, unique: true },
  college: 					{ type: String, required: true },
	profilepic:				{ type: String, unique: true, default: "" },

  interests: 				{ type: [String], required: true, default: [] },
	
  status: 					{ type: Number, required: true, default: USERSTATUS_CODES.TEMPORARY },
  role: 						{ type: Number, required: true, default: USERROLE_CODES.REGULAR },

  otp: 							{ type: String },
	resetOtp: 				{ type: String },
	
  createdAt: 				{ type: Date, required: true, default: Date.now },
});

userSchema.method('transform', function() {
	var obj = this.toObject();

	//Rename fields
	obj.id = obj._id;
	delete obj._id;

	return obj;
});

const User = mongoose.model("users", userSchema);

module.exports = User;
module.exports.USERSTATUS_CODES = USERSTATUS_CODES;
module.exports.USERROLE_CODES = USERROLE_CODES;
