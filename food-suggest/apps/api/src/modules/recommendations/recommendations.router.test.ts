import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import { createLogger } from '../../lib/logger.js';
import type { MealsRepository } from '../meals/meals.repository.js';
import { seedCandidates } from './seed-candidates.test-helper.js';

const logger = createLogger({ LOG_LEVEL: 'silent', NODE_ENV: 'test' });
const repo: MealsRepository = {
  list: vi.fn(),
  getBySlug: vi.fn(),
  listCandidates: vi.fn(async () => seedCandidates()),
  cardsBySlugs: vi.fn(async () => []),
  recipesBySlugs: vi.fn(async () => new Map()),
};
const app = createApp({ logger, mealsRepo: repo });
const profile = { birthYear: 1990, allergens: ['PEANUT'] };

describe('POST /v1/recommendations', () => {
  it('works without an account and applies allergy filters', async () => {
    const res = await request(app).post('/v1/recommendations').send({ profile, limit: 20 });
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    const slugs = res.body.items.map((i: { meal: { slug: string } }) => i.meal.slug);
    expect(slugs).not.toContain('groundnut-soup-omo-tuo');
    expect(slugs).not.toContain('oats-banana-groundnut');
  });

  it('rejects under-16s and unknown fields', async () => {
    const young = await request(app).post('/v1/recommendations').send({ profile: { birthYear: new Date().getUTCFullYear() - 14 } });
    expect(young.status).toBe(400);
    const extra = await request(app).post('/v1/recommendations').send({ profile: { birthYear: 1990, isAdmin: true } });
    expect(extra.status).toBe(400);
  });

  it('rejects invalid allergens rather than silently ignoring them', async () => {
    const res = await request(app).post('/v1/recommendations').send({ profile: { birthYear: 1990, allergens: ['NUTS'] } });
    expect(res.status).toBe(400);
  });

  it('has its own, stricter rate limit', async () => {
    const limited = createApp({ logger, mealsRepo: repo });
    let last = 0;
    for (let i = 0; i < 31; i++) last = (await request(limited).post('/v1/recommendations').send({ profile })).status;
    expect(last).toBe(429);
  });
});
