require("dotenv").config();
const mongoose = require("mongoose");
const URI = process.env.MONGODB_URI;
const database = () => {
  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    mongoose.connect(
      URI,
      connectionParams
    );
    console.log("Connection successful");
  } catch (err) {
    console.log("Connection failed");
  }
};

module.exports = database;
