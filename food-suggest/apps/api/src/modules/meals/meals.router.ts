import { Router } from 'express';
import { z } from 'zod';

import { MealListQuery } from '@food-suggest/shared';

import { HttpError } from '../../lib/http-error.js';
import type { MealsRepository } from './meals.repository.js';

const SlugParam = z.string().regex(/^[a-z0-9-]{1,80}$/);

/** Public, read-only meal catalogue. Works without an account. */
export function mealsRouter(repo: MealsRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const query = MealListQuery.parse(req.query);
    res.set('Cache-Control', 'public, max-age=60');
    res.json(await repo.list(query));
  });

  router.get('/:slug', async (req, res) => {
    const slug = SlugParam.safeParse(req.params.slug);
    if (!slug.success) throw HttpError.notFound('Meal not found');
    const meal = await repo.getBySlug(slug.data);
    if (!meal) throw HttpError.notFound('Meal not found');
    res.set('Cache-Control', 'public, max-age=60');
    res.json(meal);
  });

  return router;
}
