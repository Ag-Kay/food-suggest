import { Router } from 'express';

import type { Db } from '../../lib/db.js';

/** Cuisines, categories and ingredients for filters and preference pickers. */
export function catalogueRouter(db: Db): Router {
  const router = Router();

  router.get('/cuisines', async (_req, res) => {
    const items = await db.cuisine.findMany({ orderBy: { name: 'asc' }, select: { slug: true, name: true } });
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ items });
  });

  router.get('/categories', async (_req, res) => {
    const items = await db.category.findMany({ orderBy: { name: 'asc' }, select: { slug: true, name: true } });
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ items });
  });

  router.get('/ingredients', async (_req, res) => {
    const items = await db.ingredient.findMany({
      orderBy: { name: 'asc' },
      select: { slug: true, name: true, aliases: true, shoppingCategory: true },
    });
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ items });
  });

  return router;
}
