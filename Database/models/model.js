const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const UserStatus = {
  TEMPORARY: 0,
  PERMANENT: 1,
  BANNED: -1,
};
const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: UserStatus.TEMPORARY,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  interests: {
    type: [String],
    required: false,
  },
  college: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
