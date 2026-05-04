'use strict';
const logger = require('../config/logger');

/**
 * Wraps an object's methods with logging.
 * @param {string} serviceName - Name of the service for logging context.
 * @param {Object} methods - Object containing methods to wrap.
 * @param {Object} config - Configuration for logging (method name -> { level, logParams, logResults }).
 * @returns {Object} Wrapped methods.
 */
function wrapWithLogging(serviceName, methods, config = {}) {
  const wrapped = {};

  Object.keys(methods).forEach((methodName) => {
    const originalMethod = methods[methodName];
    if (typeof originalMethod !== 'function') {
      wrapped[methodName] = originalMethod;
      return;
    }

    const methodConfig = config[methodName] || {};
    const level = methodConfig.level || 'info';
    const logParams = methodConfig.logParams !== false;
    const logResults = methodConfig.logResults !== false;

    wrapped[methodName] = async function (...args) {
      const paramsStr = logParams ? JSON.stringify(args).substring(0, 500) : '[OMITTED]';
      const startTime = Date.now();

      logger.log(level, `▶▶▶ [START] ${serviceName}.${methodName}() | params=${paramsStr}`);

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        const resultStr = logResults ? (result ? JSON.stringify(result).substring(0, 500) : 'null') : '[OMITTED]';

        logger.log(level, `◀◀◀ [END]   ${serviceName}.${methodName}() | duration=${duration}ms | return=${resultStr}`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`✘✘✘ [ERROR] ${serviceName}.${methodName}() | duration=${duration}ms | error=${error.message}`, { stack: error.stack });
        throw error;
      }
    };
  });

  return wrapped;
}

module.exports = { wrapWithLogging };
