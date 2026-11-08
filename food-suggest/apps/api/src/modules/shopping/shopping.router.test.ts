import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import { createLogger } from '../../lib/logger.js';
import type { MealsRepository } from '../meals/meals.repository.js';
import { seedRecipes } from './seed-recipes.test-helper.js';

const logger = createLogger({ LOG_LEVEL: 'silent', NODE_ENV: 'test' });
const repo: MealsRepository = {
  list: vi.fn(),
  getBySlug: vi.fn(),
  listCandidates: vi.fn(async () => []),
  cardsBySlugs: vi.fn(async () => []),
  recipesBySlugs: vi.fn(async () => seedRecipes()),
};
const app = createApp({ logger, mealsRepo: repo });

describe('POST /v1/shopping-list', () => {
  it('builds a list without an account', async () => {
    const res = await request(app)
      .post('/v1/shopping-list')
      .send({ entries: [{ slug: 'jollof-rice-chicken', servings: 2 }, { slug: 'unknown-meal', servings: 1 }] });
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.skipped).toEqual(['unknown-meal']);
    const rice = res.body.items.find((i: { ingredientSlug: string }) => i.ingredientSlug === 'rice-white');
    // Jollof makes 4 servings from 400 g rice → 2 servings need 200 g.
    expect(rice).toMatchObject({ quantity: 200, unit: 'g', amountText: '200 g', meals: ['Jollof rice with chicken'] });
  });

  it('validates the request strictly', async () => {
    const cases = [
      {},
      { entries: [] },
      { entries: [{ slug: 'jollof-rice-chicken', servings: 0 }] },
      { entries: [{ slug: 'jollof-rice-chicken', servings: 13 }] },
      { entries: [{ slug: 'jollof-rice-chicken', servings: 1, userId: 'x' }] },
      { entries: Array.from({ length: 121 }, () => ({ slug: 'a', servings: 1 })) },
    ];
    for (const body of cases) {
      expect((await request(app).post('/v1/shopping-list').send(body)).status).toBe(400);
    }
  });

  it('has its own rate limit', async () => {
    const limited = createApp({ logger, mealsRepo: repo });
    let last = 0;
    const body = { entries: [{ slug: 'jollof-rice-chicken', servings: 1 }] };
    for (let i = 0; i < 31; i++) last = (await request(limited).post('/v1/shopping-list').send(body)).status;
    expect(last).toBe(429);
  });
});
