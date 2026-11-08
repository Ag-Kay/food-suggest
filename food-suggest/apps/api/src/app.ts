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
import { recommendationsRouter } from './modules/recommendations/recommendations.router.js';
import { meRouter, type MeRouterDeps } from './modules/me/me.router.js';
import { shoppingRouter } from './modules/shopping/shopping.router.js';

const SYNC_PATH = '/v1/me/sync';

export interface AppDeps {
  logger: Logger;
  /** Requests per minute per IP across the API. */
  rateLimitPerMinute?: number;
  /** Database-backed features are mounted only when provided (tests can omit them). */
  db?: Db;
  mealsRepo?: MealsRepository;
  /** Account routes; mounted only when sign-in is configured. */
  account?: Omit<MeRouterDeps, 'meals'>;
  /** Browser origins allowed to call the API (development only: Expo web). Native apps don't need CORS. */
  corsOrigins?: string[];
}

export function createApp({
  logger,
  rateLimitPerMinute = 120,
  db,
  mealsRepo,
  account,
  corsOrigins = [],
}: AppDeps): Express {
  const app = express();

  // Behind one reverse proxy (Render/Railway) in production, so req.ip is the client.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  if (corsOrigins.length) {
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && corsOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Vary', 'Origin');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Accept, Content-Type, Authorization');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        if (req.method === 'OPTIONS') return void res.sendStatus(204);
      }
      next();
    });
  }
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
  // 100 KB for every route except account sync, which parses its own (larger) body.
  const json = express.json({ limit: '100kb' });
  app.use((req, res, next) => (req.path === SYNC_PATH ? next() : json(req, res, next)));
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
  if (mealsRepo) {
    v1.use('/meals', mealsRouter(mealsRepo));
    v1.use('/recommendations', recommendationsRouter(mealsRepo));
    v1.use('/shopping-list', shoppingRouter(mealsRepo));
    if (account) v1.use('/me', meRouter({ ...account, meals: mealsRepo }));
  }
  if (db) v1.use('/', catalogueRouter(db));
  app.use('/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
