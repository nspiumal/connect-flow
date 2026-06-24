'use strict';
const { ActivityLogEntry } = require('../model');
const { v4: uuidv4 } = require('uuid');

/**
 * Express middleware that logs an activity entry after each POST request.
 * Runs asynchronously so it never delays the response.
 */
function activityLogMiddleware(req, res, next) {
  // Only log POST requests (mutating actions); skip GET and all others
  if (req.method !== 'POST') {
    return next();
  }

  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = function (body) {
    // Call after response is sent
    setImmediate(() => {
      try {
        const userEmail = req.user ? req.user.email : null;
        const userName = req.user ? req.user.fullName : null;
        const action = `${req.method} ${req.route ? req.route.path : req.path}`;
        const description = `${req.method} ${req.originalUrl} - ${res.statusCode}`;

        ActivityLogEntry.create({
          id: uuidv4(),
          userName,
          userEmail,
          action: action.substring(0, 100),
          description: description.substring(0, 500),
          httpMethod: req.method,
          endpoint: req.originalUrl.substring(0, 500),
          ipAddress: req.ip,
          status: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS',
          errorMessage: res.statusCode >= 400 ? (body && body.message ? String(body.message).substring(0, 1000) : null) : null,
          createdAt: new Date()
        }).catch(() => {/* swallow logging errors */ });
      } catch (_) {/* swallow */ }
    });

    return originalJson(body);
  };

  next();
}

module.exports = activityLogMiddleware;
