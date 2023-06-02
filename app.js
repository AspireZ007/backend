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

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


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


app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.get("/verify/:token", async (req, res) => {
  const token = req.params.token;
  user =  await index.getDetailsByToken(token);
  const user_id = user.username;
  const b = token.split(".")[1];
  const decrpt = JSON.parse(Buffer.from(b, "base64").toString("ascii"));
  const recived_id = decrpt.username;
  if (user_id == recived_id) {
    res.send("Email verified");
  } else {
    res.send("Email not verified");
  }
  console.log(user)
  console.log("received user : " + recived_id + "user_id : " + user_id);
});

app.post("/signup", async (req, res) => {
  const payload = req.body;
  const {name , email , password , phone_number , username , college} = payload;
  const token = jwt.sign({email: email, username: username}, secretkey);
  const b = token.split(".")[1];
  try {
    index.createUser(name , email , password , phone_number , username , null , college , token);
    sendMail(token, req.body.email);
  } catch (err) {
    console.log(err);
  }
  const decrpt = JSON.parse(Buffer.from(b, "base64").toString("ascii"));
  console.log(req.body);
  res.send(decrpt);
});
app.listen(3000, () => {
  try{
    database();
  }
  catch (err) {
    console.log(err);
  }
  console.log("Server is running on port 3000");
});
