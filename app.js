require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const app = express();
const validation = require("./validation");
const Window = require("window");
const secretkey = process.env.SECRET_KEY;
const index = require("./Database/index");
const database = require("./Database/database");
const bcrypt = require("bcryptjs");
const login = require('./validation/login');
const signup_validation = require('./validation/signup');
const salt = 10
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


const errorCodesDescription = {
  "200": "Login successful",
  "201b": "Account Successfully Created",
  "400": "Bad Request",
  "400z" : "Empty Fields detected",
  "400a": "Invalid Email",
  "400b": "Invalid Password",
  "400c": "Invalid Name",
  "400d": "Invalid Username",
  "400e": "Invalid College Name",
  "401": "Password Mismatch",
  "404": "User Not Found",
  "409": "Conflict",
  "409a": "Email Already Exists",
  "409b": "Username Already Exists",
  "500": "Internal Server Error",
  "201a" : "Email sucessfully sent"

}


/**
 * 
 * @param {string} token 
 * @param {string} reciver 
 */

const sendMail = (token, reciver) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    secureConnection: false,
    port: 587,
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: "aspirezofficial@outlook.com",
      pass: "aspirez007",
    },
  });

  let message = `Hi! There, You have recently visited
  our website and entered your email.
  Please follow the given link to verify your email
  http://localhost:3000/verify/${token}
  Thanks`;
  var mailOptions = {
    from: "aspirezofficial@outlook.com", // sender address (who sends)
    to: reciver, // list of receivers (who receives)
    subject: "Email Verification", // Subject line
    text: message, // plaintext body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }

    console.log("Message sent: " + info.response);
  });
};

/**
 * home get request
 */
app.get("/", async (req, res) => {
  res.send("Hello World");
});


/**
 * email verification get request
 * @param {string} token
 */
app.get("/verify/:token", async (req, res) => {
  const token = req.params.token;
  try{
    user = await index.getDetailsByToken(token);
    if(!user) res.status(400).json({ error: errorCodesDescription['400'] });
  }
  catch(err){
    res.status(500).json({ message: errorCodesDescription['500'] });
  }
  const user_id = user.username;
  const b = token.split(".")[1];
  const decrpt = JSON.parse(Buffer.from(b, "base64").toString("ascii"));
  const recived_id = decrpt.username;

  //status of the user should be changed to verified
  if (user_id == recived_id) {
    res.status(201).send(errorCodesDescription['201b']);
  } else {
    res.status(400).json({ error: errorCodesDescription['400'] });
  }
});


/**
  * signup post request
  * @param {string} name
  * @param {string} email
  * @param {string} password
  * @param {string} phone_number
  * @param {string} username
  * @param {string} college
  * @param {string} confirm_password
  * @returns {json} status
*/
app.post("/signup", async (req, res) => {
  const payload = req.body;
  const { name, email, password, phone_number, username, college, confirm_password } = payload;
  signup_validation(payload).then((validation_result) => {
    if (validation_result == "200") {
      const hashedpassword = bcrypt.hashSync(password, salt);
      const token = jwt.sign({ email: email, username: username }, secretkey);
      const b = token.split(".")[1];
      index.createUser(name, email, hashedpassword, phone_number, username, null, college, token).then((httpcode) => {
        if (httpcode == 201) {
          sendMail(token, req.body.email);
          res.status(201).json({ message: errorCodesDescription['201a'] });
        } else if (httpcode == 409) {
          res.status(409).json({ error: errorCodesDescription['409a'] });
        } else {
          res.status(500).json({ error: errorCodesDescription['500'] });
        }
      });
    }
    else {
      res.status(400).json({ error: errorCodesDescription[validation_result] })
    }
  });
});


/**
 * login post request
 * @param {string} email
 * @param {string} password
 * @returns {json} status
 */
app.post("/login", async (req, res) => {
  const result = await login(req.body.email, req.body.password);
  if (result === "200") {
    res.status(200).json({ status: errorCodesDescription[result] });
  }
  else{
    res.status(Number(result.substring(0, 3))).json({ error: errorCodesDescription[result] });
  }
});


/**
 * listen to port 3000
 * @param {number} port
 * @returns {string} message
 * @returns {string} error
*/
app.listen(3000, () => {
  try {
    database();
  }
  catch (err) {
    console.log(err);
  }
  console.log("Server is running on port 3000");
});
