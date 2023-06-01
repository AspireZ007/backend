const mongoose = require("mongoose");

const database = () => {
  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    mongoose.connect(
      "mongodb+srv://aspirezofficial:aspirez007@aspirez.g46ctxn.mongodb.net/aspirez?retryWrites=true&w=majority",
      connectionParams
    );
    console.log("Connection successful");
  } catch (err) {
    console.log("Connection failed");
  }
};

module.exports = database;
