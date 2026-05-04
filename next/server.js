'use strict';

const path = require('path');

// ── Load env vars BEFORE any backend module is required ──────────────────────
// Next.js loads .env.local natively, but the custom server starts before that,
// so we need to load it explicitly here first.
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // fallback

const http = require('http');
const next = require('next');
const { app: expressApp, bootstrap } = require('./backend/src/app');

const dev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  // 1️⃣  Bootstrap Express layer: connect DB, run migrations, seed, start scheduler
  await bootstrap();

  // 2️⃣  Prepare Next.js
  const nextApp = next({ dev, dir: __dirname });
  const nextHandler = nextApp.getRequestHandler();
  await nextApp.prepare();

  // 3️⃣  Single HTTP server: Express handles /api/* and /api-docs; Next.js handles the rest
  const server = http.createServer((req, res) => {
    const url = req.url || '';
    if (url.startsWith('/api') || url.startsWith('/api-docs')) {
      expressApp(req, res);
    } else {
      nextHandler(req, res);
    }
  });

  server.listen(PORT, () => {
    console.log(`\n[Server] Connect Flow running on http://localhost:${PORT}`);
    console.log(`[Swagger] API docs at          http://localhost:${PORT}/api-docs\n`);
  });
}

start().catch((err) => {
  console.error('[Server] Fatal error during startup:', err);
  process.exit(1);
});

