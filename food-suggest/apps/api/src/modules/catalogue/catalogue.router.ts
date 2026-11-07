import { Router } from 'express';

import type { Db } from '../../lib/db.js';

/** Cuisines and categories for the Discover filters. */
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

  return router;
}
