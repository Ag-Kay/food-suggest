import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { RecommendationRequest } from '@food-suggest/shared';

import type { MealsRepository } from '../meals/meals.repository.js';
import { recommend } from './engine.js';

/**
 * POST /v1/recommendations
 *
 * Anonymous-friendly: the on-device profile is sent in the body, used for this
 * request only, and never stored or logged (request bodies are not logged).
 * POST keeps health data out of URLs, server logs and caches.
 */
export function recommendationsRouter(repo: MealsRepository, { perMinute = 30 } = {}): Router {
  const router = Router();

  router.post(
    '/',
    rateLimit({
      windowMs: 60_000,
      limit: perMinute,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
      },
    }),
    async (req, res) => {
      const { profile, slot, limit } = RecommendationRequest.parse(req.body);
      const candidates = await repo.listCandidates();
      res.set('Cache-Control', 'no-store');
      res.json(recommend(candidates, profile, { slot, limit }));
    },
  );

  return router;
}
