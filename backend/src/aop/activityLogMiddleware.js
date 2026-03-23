'use strict';
const { ActivityLogEntry } = require('../model');
const { v4: uuidv4 } = require('uuid');

/**
 * Express middleware that logs an activity entry after each non-public request.
 * Runs asynchronously so it never delays the response.
 */
function activityLogMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = function (body) {
    // Call after response is sent
    setImmediate(() => {
      try {
        const userId = req.user ? req.user.id : null;
        const action = `${req.method} ${req.route ? req.route.path : req.path}`;
        const description = `${req.method} ${req.originalUrl} - ${res.statusCode}`;
        const metadata = JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startTime,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        ActivityLogEntry.create({
          id: uuidv4(),
          userId,
          action,
          description,
          metadata,
        }).catch(() => {/* swallow logging errors */});
      } catch (_) {/* swallow */}
    });

    return originalJson(body);
  };

  next();
}

module.exports = activityLogMiddleware;
