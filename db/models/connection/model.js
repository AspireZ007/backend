const mongoose = require("mongoose")

const connectionSchema = new mongoose.Schema({
    following: { type: String, required: true },
    follower: { type: String, required: true },
    connectionTime: { type: Date, required: true, default: Date.now }
});

const Connection = mongoose.model("connections", connectionSchema)

module.exports = Connection;