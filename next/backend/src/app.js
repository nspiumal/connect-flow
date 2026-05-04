'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const sequelize = require('./config/database');
const { startOverdueScheduler } = require('./scheduler/OverdueScheduler');
const jwtMiddleware = require('./security/jwtMiddleware');
const activityLogMiddleware = require('./aop/activityLogMiddleware');
const routes = require('./routes');

// Import all models to ensure associations are registered
require('./model');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Swagger docs (public)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JWT authentication
app.use(jwtMiddleware);

// Activity logging (only for authenticated routes)
app.use(activityLogMiddleware);

// Mount all API routes under /api
app.use('/api', routes);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(`[GlobalError] ${status} ${req.method} ${req.url} — ${err.message}`);
    if (err.stack) console.error(err.stack);
  } else {
    console.warn(`[GlobalError] ${status} ${req.method} ${req.url} — ${err.message}`);
  }
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connected to MySQL successfully.');

    // Create tables that are owned by the Node.js app and not managed by
    // Spring Boot's Hibernate (no corresponding @Entity in the Java project).
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`transaction_profits\` (
        \`id\`                   CHAR(36)       NOT NULL,
        \`transaction_id\`       CHAR(36)       DEFAULT NULL,
        \`profit_amount\`        DECIMAL(18,2)  DEFAULT NULL,
        \`pawn_id\`              VARCHAR(255)   DEFAULT NULL,
        \`profit_notes\`         TEXT           DEFAULT NULL,
        \`profit_recorded_date\` DATETIME       DEFAULT NULL,
        \`profit_recorded_by\`   CHAR(36)       DEFAULT NULL,
        \`created_at\`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_tp_transaction_id\` (\`transaction_id\`),
        KEY \`idx_tp_profit_recorded_date\` (\`profit_recorded_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[DB] transaction_profits table ready.');

    // Ensure the activity_log table has all columns defined in the Sequelize model.
    // Spring Boot's Hibernate may have created the table before newer columns were added
    // to the Java entity (user_name, user_email, http_method, endpoint, ip_address, etc.)
    const activityLogColumns = [
      "ADD COLUMN IF NOT EXISTS `user_name`    VARCHAR(255)  DEFAULT NULL",
      "ADD COLUMN IF NOT EXISTS `user_email`   VARCHAR(255)  DEFAULT NULL",
      "ADD COLUMN IF NOT EXISTS `http_method`  VARCHAR(10)   DEFAULT NULL",
      "ADD COLUMN IF NOT EXISTS `endpoint`     VARCHAR(500)  DEFAULT NULL",
      "ADD COLUMN IF NOT EXISTS `ip_address`   VARCHAR(50)   DEFAULT NULL",
      "ADD COLUMN IF NOT EXISTS `status`       VARCHAR(20)   DEFAULT NULL",
      "ADD COLUMN IF NOT EXISTS `error_message` VARCHAR(1000) DEFAULT NULL",
    ];
    for (const col of activityLogColumns) {
      await sequelize.query(`ALTER TABLE \`activity_log\` ${col};`).catch(() => {});
    }
    console.log('[DB] activity_log columns verified.');

    // Widen profiles.pin so it can store a 60-char bcrypt hash (was incorrectly VARCHAR(10))
    await sequelize.query(
      "ALTER TABLE `profiles` MODIFY COLUMN `pin` VARCHAR(255) DEFAULT NULL;"
    ).catch(() => {});
    console.log('[DB] profiles.pin column verified.');

    // Start cron scheduler
    startOverdueScheduler();

    console.log('[Bootstrap] Express app ready.');
  } catch (err) {
    console.error('[Bootstrap] Failed to initialise:', err);
    throw err; // Let the combined server handle exit
  }
}

module.exports = { app, bootstrap };
