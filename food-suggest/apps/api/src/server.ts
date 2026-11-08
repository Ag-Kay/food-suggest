import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createDb } from './lib/db.js';
import { createLogger } from './lib/logger.js';
import { createSupabaseAuthAdmin } from './modules/auth/auth-admin.js';
import { createSupabaseVerifier } from './modules/auth/verify-token.js';
import { createMealsRepository } from './modules/meals/meals.repository.js';
import { createAccountRepository } from './modules/me/account.repository.js';
import { createSyncRepository } from './modules/sync/sync.repository.js';

const env = loadEnv();
const logger = createLogger(env);
const db = env.DATABASE_URL ? createDb(env.DATABASE_URL) : undefined;
if (!db) logger.warn('DATABASE_URL not set: only /v1/health is available');
const account =
  db && env.SUPABASE_URL && env.SUPABASE_SECRET_KEY
    ? {
        verify: createSupabaseVerifier(env.SUPABASE_URL),
        accounts: createAccountRepository(db),
        authAdmin: createSupabaseAuthAdmin(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY),
        sync: createSyncRepository(db),
      }
    : undefined;
if (db && !account) logger.warn('SUPABASE_URL / SUPABASE_SECRET_KEY not set: account routes are disabled');

const app = createApp({
  logger,
  db,
  account,
  mealsRepo: db && createMealsRepository(db),
  // Expo web dev server only; never enabled in production.
  corsOrigins: env.NODE_ENV === 'development' ? ['http://localhost:8081'] : [],
});

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
