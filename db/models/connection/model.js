const mongoose = require("mongoose")

const CONNECTIONSTATUS_CODES = {
  ALLOWED: 1,
  BLOCKED: -1
};

const connectionSchema = new mongoose.Schema({
	following: 					{ type: String, required: true, ref: "users" },
	follower: 					{ type: String, required: true, ref: "users" },
	connectionTime: 		{ type: Date, required: true, default: Date.now },
	isBlocked:					{ type: Number, required: true, default: CONNECTIONSTATUS_CODES.ALLOWED }
});

connectionSchema.index({ "follower": 1 }, { unique: true })
connectionSchema.index({ "following": 1 }, { unique: true })

connectionSchema.method('transform', function() {
	var obj = this.toObject();

	//Rename fields
	obj.id = obj._id;
	delete obj._id;

	return obj;
});

const Connection = mongoose.model("connections", connectionSchema)

module.exports = { Connection, CONNECTIONSTATUS_CODES };