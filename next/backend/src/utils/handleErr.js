'use strict';

/**
 * Unified error handler for all Express controllers.
 * Logs the error to the console and sends the appropriate JSON response.
 *
 * @param {import('express').Response} res
 * @param {Error & { status?: number }} err
 * @param {string} [context] - Optional label to identify the controller / operation in logs.
 */
function handleErr(res, err, context = 'API') {
  const status = err.status || 500;

  if (status >= 500) {
    // Unexpected server error – log full stack
    console.error(`[${context}] ❌ ${status} Internal Error: ${err.message}`);
    if (err.stack) console.error(err.stack);
  } else {
    // Expected client-side error (4xx) – compact warning is enough
    console.warn(`[${context}] ⚠️  ${status} Client Error: ${err.message}`);
  }

  res.status(status).json({ message: err.message || 'Internal server error' });
}

module.exports = handleErr;

