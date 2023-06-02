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
  user = await index.getDetailsByToken(token);
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

// app.post("/signup", async (req, res) => {
//   const payload = req.body;
//   const { name, email, password, phone_number, username, college } = payload;
//   const validation_result = signup_validation(payload);
//   if (validation_result == "200") {
//     const hashedpassword = bcrypt.hashSync(password, salt);
//     const token = jwt.sign({ email: email, username: username }, secretkey);
//     const b = token.split(".")[1];
//     try {
//       const httpcode = await index.createUser(name, email, hashedpassword, phone_number, username, null, college, token);
//       if (httpcode == 201) {
//         try{
//           sendMail(token, req.body.email);
//           res.status(201).json({ message: "Account created Succussfully" });
//         }catch(err){

//           res.status(400).json({ message: "Error in sending email" });
//         }
//       } else if (httpcode == 409) {
//         res.status(409).json({ error: "Already exists" });
//       } else if (httpcode == 500) {
//         res.status(500).json({ error: "Internal server error" })
//       }

//     } catch (err) {
//       console.log(err);
//     }
//     const decrpt = JSON.parse(Buffer.from(b, "base64").toString("ascii"));
//     console.log(req.body);
//     res.send(decrpt);
//   }
//   else if (validation_result == "400") {
//     res.status(400).json({ error: "Missing Parameters" })
//   }
//   else if (validation_result == "401") {
//     res.status(401).json({ error: "Confirm Password doesn't match" })
//   } else if (validation_result == "400a") {
//     res.status(400).json({ error: "Invalid Mail Format" })
//   } else if (validation_result == "400c") {
//     res.status(400).json({ error: "Invalid Name" })
//   } else if (validation_result == "400e") {
//     res.status(400).json({ error: "Invalid College" })
//   } else if (validation_result == "409a") {
//     res.status(409).json({ error: "Email Already exists" })
//   } else if (validation_result == "409b") {
//     res.status(409).json({ error: "Username Already exists" })
//   } else if (validation_result == "400f") {
//     res.status(400).json({ error: "Invalid Username" })
//   }

// });


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

app.post("/login", async (req, res) => {
  const result = await login(req.body.email, req.body.password);
  if (result == 200) {
    res.send(result);
  }
  else if (result == 404) {
    res.status(404).json({ error: "Email Not Found" })
  } else if (result == 401) {
    res.status(401).json({ error: "Incorrect Password" })
  } else if (result == "400") {
    res.status(400).json({ error: "Empty Fields" })
  } else if (result == "400a") {
    res.status(400).json({ error: "Invalid Email Format " })
  } else if (result == "400b") {
    res.status(400).json({ error: "Invalid Password Format" })
  }

});


app.listen(3000, () => {
  try {
    database();
  }
  catch (err) {
    console.log(err);
  }
  console.log("Server is running on port 3000");
});
