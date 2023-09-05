require('dotenv').config();
const jwt = require('jsonwebtoken');
const generateAccessToken = (username,email,verified,user_id) => {
    return jwt.sign({username, email,verified,user_id}, process.env.PRIVATE_KEY, { expiresIn: process.env.JWT_EXPIRES_IN });
}

exports.generateAccessToken = generateAccessToken;