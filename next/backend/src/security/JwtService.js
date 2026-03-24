'use strict';
const jwt = require('jsonwebtoken');
require('dotenv').config();

const rawSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const expirationMs = parseInt(process.env.JWT_EXPIRATION || '86400000', 10);

// Mirror Java: repeat secret 4x, take first 32+ bytes as UTF-8 buffer
const padded = rawSecret.repeat(4);
const keyBuffer = Buffer.from(padded, 'utf8');

function generateToken(subject) {
  return jwt.sign(
    { sub: subject },
    keyBuffer,
    { algorithm: 'HS256', expiresIn: Math.floor(expirationMs / 1000) }
  );
}

function validateAndGetSubject(token) {
  const decoded = jwt.verify(token, keyBuffer, { algorithms: ['HS256'] });
  return decoded.sub;
}

module.exports = { generateToken, validateAndGetSubject };
