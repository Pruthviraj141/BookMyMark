import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { getDb, closeDb } from './database/connection.js';

// Initialize SQLite database
getDb();

const app = createApp();

console.log(`Starting MyBookMark Backend...`);

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
    hostname: env.HOST
  },
  (info) => {
    console.log(`✓ MyBookMark API running on http://${info.address}:${info.port}`);
    console.log(`✓ Health check available at http://${info.address}:${info.port}/health`);
  }
);

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down MyBookMark backend...');
  closeDb();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
