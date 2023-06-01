const User = require("./models/model");

async function createUser(
  i_name,
  i_email,
  i_password,
  i_phone_number,
  i_username,
  i_interests,
  i_college,
  i_token
) {
  try {
    const newUser = new User({
      name: i_name,
      email: i_email,
      password: i_password,
      phone_number: i_phone_number,
      username: i_username,
      interests: i_interests,
      college: i_college,
      token: i_token,
    });

    await newUser.save();
    console.log("inserted");
  } catch (err) {
    console.error("Error saving user:", err);
  }
}

async function getDetailsByToken(i_token) {
  try {
    const users = await User.findOne({ token: i_token });
    return users; 
  } catch (err) {
    console.error("Error finding users:", err);
  }
}

module.exports.createUser = createUser;
module.exports.getDetailsByToken = getDetailsByToken;
