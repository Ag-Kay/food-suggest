import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createDb } from './lib/db.js';
import { createLogger } from './lib/logger.js';
import { createMealsRepository } from './modules/meals/meals.repository.js';

const env = loadEnv();
const logger = createLogger(env);
const db = env.DATABASE_URL ? createDb(env.DATABASE_URL) : undefined;
if (!db) logger.warn('DATABASE_URL not set: only /v1/health is available');
const app = createApp({ logger, db, mealsRepo: db && createMealsRepository(db) });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Food Suggest API listening');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    void (db?.$disconnect() ?? Promise.resolve()).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
