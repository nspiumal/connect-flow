'use strict';
const { ActivityLogEntry } = require('../model');
const { v4: uuidv4 } = require('uuid');

/**
 * Express middleware that logs an activity entry after each authenticated request.
 * Runs asynchronously so it never delays the response.
 * Writes to the `activity_log` table matching the Spring Boot JPA schema exactly.
 */
function activityLogMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = function (body) {
    // Capture all values synchronously — req.route and res.statusCode are
    // reliable right now (inside the active route handler call stack).
    const user       = req.user;
    const httpMethod = req.method;
    const endpoint   = req.originalUrl;
    const statusCode = res.statusCode;
    const routePath  = req.route ? req.route.path : req.path;
    const duration   = Date.now() - startTime;

    setImmediate(() => {
      try {
        // Only log requests that belong to a known user
        if (!user) return;

        // Don't log GET requests — only record mutating operations
        if (httpMethod === 'GET') return;

        // Don't log activity-log read requests — avoids self-referential noise
        if (endpoint.startsWith('/api/activity-logs')) return;

        const action      = `${httpMethod} ${routePath}`.substring(0, 100);
        const description = `${httpMethod} ${endpoint} [${statusCode}] (${duration}ms)`.substring(0, 500);

        ActivityLogEntry.create({
          id:           uuidv4(),
          userName:     user.fullName  || user.email || null,
          userEmail:    user.email     || null,
          action,
          description,
          httpMethod,
          endpoint:     endpoint.substring(0, 500),
          ipAddress:    req.ip || null,
          status:       statusCode < 400 ? 'SUCCESS' : 'FAILURE',
          errorMessage: statusCode >= 400 ? (body && body.message) || null : null,
          createdAt:    new Date(),
        }).catch((err) => { console.error('[ActivityLog] Failed to write log entry:', err.message); });
      } catch (err) {
        console.error('[ActivityLog] Unexpected error in logging middleware:', err.message);
      }
    });

    return originalJson(body);
  };

  next();
}

module.exports = activityLogMiddleware;
