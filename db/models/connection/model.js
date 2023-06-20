const mongoose = require("mongoose")

const CONNECTIONSTATUS_CODES = {
	ALLOWED: 0,
	BLOCKED: 1
}

const connectionSchema = new mongoose.Schema({
	following: 						{ type: String, required: true, ref: "users" },
	follower: 						{ type: String, required: true, ref: "users" },
	connectionTime: 			{ type: Date, required: true, default: Date.now },

	isBlocked: 						{ type: Number, required: true, default: CONNECTIONSTATUS_CODES.ALLOWED },
	blockedTime: 					{ type: Date },
	isUnfollowed: 				{ type: Number, required: true, default: CONNECTIONSTATUS_CODES.ALLOWED },
	unfollowedTime: 			{ type: Date }
})

const Connection = mongoose.model("connections", connectionSchema)

module.exports = { Connection, CONNECTIONSTATUS_CODES };