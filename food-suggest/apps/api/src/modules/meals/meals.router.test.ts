import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { MealDetail } from '@food-suggest/shared';

import { createApp } from '../../app.js';
import { createLogger } from '../../lib/logger.js';
import type { MealsRepository } from './meals.repository.js';

const logger = createLogger({ LOG_LEVEL: 'silent', NODE_ENV: 'test' });

function fakeRepo(): MealsRepository {
  return {
    list: vi.fn(async (q) => ({ items: [], total: 0, limit: q.limit, offset: q.offset })),
    getBySlug: vi.fn(async (slug) => (slug === 'waakye' ? ({ slug: 'waakye' } as MealDetail) : null)),
  };
}

describe('GET /v1/meals', () => {
  it('passes validated, defaulted query to the repository', async () => {
    const repo = fakeRepo();
    const res = await request(createApp({ logger, mealsRepo: repo })).get('/v1/meals?slot=BREAKFAST&diet=VEGAN');
    expect(res.status).toBe(200);
    expect(repo.list).toHaveBeenCalledWith({ slot: 'BREAKFAST', diet: 'VEGAN', limit: 20, offset: 0 });
  });

  it('rejects unknown and invalid filters', async () => {
    const app = createApp({ logger, mealsRepo: fakeRepo() });
    expect((await request(app).get('/v1/meals?slot=BRUNCH')).status).toBe(400);
    expect((await request(app).get('/v1/meals?limit=500')).status).toBe(400);
    expect((await request(app).get('/v1/meals?admin=1')).status).toBe(400);
  });
});

describe('GET /v1/meals/:slug', () => {
  it('returns a meal', async () => {
    const res = await request(createApp({ logger, mealsRepo: fakeRepo() })).get('/v1/meals/waakye');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('waakye');
  });

  it('404s for unknown or malformed slugs without hitting the repo for bad input', async () => {
    const repo = fakeRepo();
    const app = createApp({ logger, mealsRepo: repo });
    expect((await request(app).get('/v1/meals/pizza')).status).toBe(404);
    expect((await request(app).get('/v1/meals/DROP%20TABLE')).status).toBe(404);
    expect(repo.getBySlug).toHaveBeenCalledTimes(1);
  });
});
