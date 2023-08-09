// passwordValidator.ts
const passwordValidator = require("password-validator");

// Create a schema
const schema = new passwordValidator();

// Add properties to it
schema
  .is()
  .min(8) // Minimum length 8
  .is()
  .max(100) // Maximum length 100
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits(2) // Must have at least 2 digits
  .has()
  .symbols(1) // Must have at least 1 symbol
  .has()
  .not()
  .spaces() // Should not have spaces
  .is()
  .not()
  .oneOf([
    "Passw0rd",
    "Password123",
    "123456",
    "123456789",
    "Qwerty",
    "Password",
    "12345",
    "12345678",
    "111111",
    "1234567",
    "123123",
    "Qwerty123",
    "1q2w3e",
    "1234567890",
    "DEFAULT",
    "0",
    "Abc123",
    "654321",
    "123321",
    "Qwertyuiop",
    "Iloveyou",
    "666666",
  ]); // Blacklist these values

// Validate a password and get detailed errors
const  validatePassword = (password) => {
  const errorMessages= [];

  if (!schema.validate(password)) {
    const validationErrors = schema.validate(password, {
      list: true,
    });
    errorMessages.push(...validationErrors.map((error) => error.message));
  }

  return errorMessages;
}
module.exports = validatePassword;