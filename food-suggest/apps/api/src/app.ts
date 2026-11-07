import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';

import type { Db } from './lib/db.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { catalogueRouter } from './modules/catalogue/catalogue.router.js';
import { healthRouter } from './modules/health/health.router.js';
import type { MealsRepository } from './modules/meals/meals.repository.js';
import { mealsRouter } from './modules/meals/meals.router.js';

export interface AppDeps {
  logger: Logger;
  /** Requests per minute per IP across the API. */
  rateLimitPerMinute?: number;
  /** Database-backed features are mounted only when provided (tests can omit them). */
  db?: Db;
  mealsRepo?: MealsRepository;
}

export function createApp({ logger, rateLimitPerMinute = 120, db, mealsRepo }: AppDeps): Express {
  const app = express();

  // Behind one reverse proxy (Render/Railway) in production, so req.ip is the client.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/v1/health' },
      // Log only what we need; headers can carry tokens and bodies health data.
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: rateLimitPerMinute,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
      },
    }),
  );

  const v1 = express.Router();
  v1.use('/health', healthRouter());
  if (mealsRepo) v1.use('/meals', mealsRouter(mealsRepo));
  if (db) v1.use('/', catalogueRouter(db));
  app.use('/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
