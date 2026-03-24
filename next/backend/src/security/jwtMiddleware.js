'use strict';
const { validateAndGetSubject } = require('./JwtService');
const { User } = require('../model');

const PUBLIC_PATHS = [
  /^\/api\/auth\//,
  /^\/api\/health/,
  /^\/api-docs/,
];

async function jwtMiddleware(req, res, next) {
  const path = req.path;
  const fullPath = req.baseUrl + path;

  if (PUBLIC_PATHS.some((r) => r.test(fullPath) || r.test(req.originalUrl))) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const email = validateAndGetSubject(token);
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    req.userEmail = email;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = jwtMiddleware;
