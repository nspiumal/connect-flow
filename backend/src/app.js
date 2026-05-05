'use strict';
require('dotenv').config();
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const sequelize = require('./config/database');
const logger = require('./config/logger');
const { startOverdueScheduler } = require('./scheduler/OverdueScheduler');
const jwtMiddleware = require('./security/jwtMiddleware');
const activityLogMiddleware = require('./aop/activityLogMiddleware');
const routes = require('./routes');

// Import all models to ensure associations are registered
require('./model');

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ── Context Root: /api ───────────────────────────────────────────────────────
const apiRouter = express.Router();

// Swagger docs (public)
apiRouter.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JWT authentication
apiRouter.use(jwtMiddleware);

// Activity logging (only for authenticated routes)
apiRouter.use(activityLogMiddleware);

// Mount all API routes
apiRouter.use('/', routes);

// Mount the router under the context root
app.use('/api', apiRouter);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  logger.error(`[GlobalError] ${status} ${req.method} ${req.url} — ${err.message}`, { stack: err.stack });
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// ── Seed initial data (mirrors Spring Boot DataInitializer) ───────────────────
async function seedData() {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  const { User, UserRole, Branch, InterestRate, ItemType } = require('./model');

  // Default branch
  let branch = await Branch.findOne({ where: { name: 'Main Branch' } });
  if (!branch) {
    branch = await Branch.create({ id: uuidv4(), name: 'Main Branch', address: 'Head Office', phone: '0000000000', isActive: true });
    console.log('[Seed] Created default branch: Main Branch');
  }

  // Default superadmin
  let admin = await User.findOne({ where: { email: 'admin@connectflow.com' } });
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 12);
    admin = await User.create({ id: uuidv4(), fullName: 'System Administrator', email: 'admin@connectflow.com', phone: '0000000000', password: hash });
    await UserRole.create({ id: uuidv4(), userId: admin.id, role: 'SUPERADMIN', branchId: branch.id });
    console.log('[Seed] Created default admin: admin@connectflow.com / admin123');
  }

  // Default interest rate
  const existingRate = await InterestRate.findOne({ where: { name: 'Standard Rate' } });
  if (!existingRate) {
    await InterestRate.create({ id: uuidv4(), name: 'Standard Rate', ratePercent: 12.0, firstMonthRatePercent: 1.0, isActive: true, isDefault: true });
    console.log('[Seed] Created default interest rate: Standard Rate 12%');
  }

  // Default item types
  const defaultTypes = ['Gold Ring', 'Gold Chain', 'Gold Bracelet', 'Gold Earring', 'Other'];
  for (const name of defaultTypes) {
    const exists = await ItemType.findOne({ where: { name } });
    if (!exists) {
      await ItemType.create({ id: uuidv4(), name, description: `${name} item type`, isActive: true, createdBy: admin.id });
      console.log(`[Seed] Created item type: ${name}`);
    }
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connected to the database successfully.');

    // Sync tables (force: true to recreate tables with correct schema)
    // await sequelize.sync({ force: true });
    console.log('[DB] All models synchronized (FORCED).');

    // await seedData();

    // Start cron scheduler
    startOverdueScheduler();

    app.listen(PORT, () => {
      console.log(`[Server] Connect Flow API running on http://localhost:${PORT}/api`);
      console.log(`[Swagger] API docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('[Bootstrap] Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
