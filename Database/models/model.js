const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const status = {};

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  name: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  phone_number:{
    type: String,
    unique: true,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },

  interests: [String],
  college: String,
  token: String,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
