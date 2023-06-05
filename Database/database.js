require("dotenv").config();
const logger = require("../validation/utilities/logger");

const mongoose = require("mongoose");
const URI = process.env.MONGODB_URI;

/**
 * @description : Object to create a Mongoose connection
 */
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
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error("Connection failed");
  }
};

module.exports = database;
