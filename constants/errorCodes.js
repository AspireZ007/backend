/**
 * @description : mapping for error codes to message
 */
const ERROR_CODES = {
  "200": "Login successful",
  "201b": "Account Successfully Created",
  "400": "Bad Request",
  "400z": "Empty Fields detected",
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
  "201a": "Email sucessfully sent"
}

module.exports = ERROR_CODES;
