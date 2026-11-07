import { pino, type Logger } from 'pino';

import type { Env } from '../config/env.js';

/**
 * Structured logger. Request bodies are never logged, and auth headers and
 * cookies are redacted, because requests can carry health data and tokens.
 */
export function createLogger(env: Pick<Env, 'LOG_LEVEL' | 'NODE_ENV'>): Logger {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '[redacted]',
    },
    ...(env.NODE_ENV === 'development' && {
      transport: { target: 'pino-pretty', options: { singleLine: true } },
    }),
  });
}
