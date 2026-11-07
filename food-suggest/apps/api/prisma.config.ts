import { defineConfig } from 'prisma/config';

// Load apps/api/.env when present (Node built-in; no dotenv dependency).
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the real environment (CI, production).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
