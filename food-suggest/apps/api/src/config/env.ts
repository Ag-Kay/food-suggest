import { z } from 'zod';

/**
 * All configuration comes from environment variables and is validated once at
 * startup, so a missing secret fails fast instead of at the first request.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url().optional(),
  /** e.g. https://abcd.supabase.co — enables sign-in routes. */
  SUPABASE_URL: z.url().optional(),
  /** Server-only secret key (sb_secret_...), used to delete auth users. Never ship to the app. */
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    // Print field names only; never echo values (they may be secrets).
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }
  return parsed.data;
}
