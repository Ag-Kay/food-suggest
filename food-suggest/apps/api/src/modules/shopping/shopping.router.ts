import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { ShoppingListRequest } from '@food-suggest/shared';

import type { MealsRepository } from '../meals/meals.repository.js';
import { buildShoppingList } from './builder.js';

/**
 * POST /v1/shopping-list
 *
 * Stateless: the app sends its planned meals (slug + servings) and gets back one
 * consolidated, grouped list. Nothing is stored; plans and lists live on the phone
 * (account sync comes in M5b).
 */
export function shoppingRouter(repo: MealsRepository, { perMinute = 30 } = {}): Router {
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
      const { entries } = ShoppingListRequest.parse(req.body);
      const recipes = await repo.recipesBySlugs(entries.map((e) => e.slug));
      res.set('Cache-Control', 'no-store');
      res.json(buildShoppingList(entries, recipes));
    },
  );

  return router;
}
