import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HEALTH_DATA_CONSENT_VERSION, type MealCard } from '@food-suggest/shared';

import { createApp } from '../../app.js';
import { createLogger } from '../../lib/logger.js';
import { InvalidTokenError, type TokenVerifier } from '../auth/verify-token.js';
import type { MealsRepository } from '../meals/meals.repository.js';
import { fakeAccounts } from './fake-account.test-helper.js';

const logger = createLogger({ LOG_LEVEL: 'silent', NODE_ENV: 'test' });
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

const verify: TokenVerifier = async (token) => {
  if (token === 'token-a') return { userId: A, email: 'a@example.com' };
  if (token === 'token-b') return { userId: B, email: 'b@example.com' };
  throw new InvalidTokenError();
};

const meals: MealsRepository = {
  list: vi.fn(),
  getBySlug: vi.fn(),
  listCandidates: vi.fn(async () => []),
  cardsBySlugs: vi.fn(async (slugs: string[]) => slugs.map((slug) => ({ slug }) as MealCard)),
};

const profile = { birthYear: 1990, allergens: ['PEANUT'], goal: 'BUILD_MUSCLE' };
const consent = { type: 'HEALTH_DATA', version: HEALTH_DATA_CONSENT_VERSION, granted: true };

function setup() {
  const accounts = fakeAccounts();
  const authAdmin = { deleteUser: vi.fn(async () => {}) };
  const app = createApp({ logger, mealsRepo: meals, account: { verify, accounts: accounts.repo, authAdmin } });
  const as = (token: string) => ({
    get: (p: string) => request(app).get(p).set('Authorization', `Bearer ${token}`),
    post: (p: string, body?: object) => request(app).post(p).set('Authorization', `Bearer ${token}`).send(body),
    put: (p: string, body?: object) => request(app).put(p).set('Authorization', `Bearer ${token}`).send(body),
    del: (p: string) => request(app).delete(p).set('Authorization', `Bearer ${token}`),
  });
  return { app, accounts, authAdmin, a: as('token-a'), b: as('token-b') };
}

let t: ReturnType<typeof setup>;
beforeEach(() => {
  t = setup();
});

describe('authentication', () => {
  it('rejects requests without a valid token', async () => {
    expect((await request(t.app).get('/v1/me')).status).toBe(401);
    expect((await request(t.app).get('/v1/me').set('Authorization', 'Bearer nope')).status).toBe(401);
    expect((await request(t.app).get('/v1/me').set('Authorization', 'Basic abc')).status).toBe(401);
  });

  it('creates the user record on first request and returns their account', async () => {
    const res = await t.a.get('/v1/me');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toMatchObject({ user: { id: A, email: 'a@example.com' }, profile: null, consents: { healthData: { granted: false } } });
    expect(t.accounts.users.has(A)).toBe(true);
  });
});

describe('health-data consent', () => {
  it('blocks saving a profile until consent is given', async () => {
    const res = await t.a.put('/v1/me/profile', profile);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('saves the profile after consent', async () => {
    expect((await t.a.post('/v1/me/consents', consent)).status).toBe(204);
    const res = await t.a.put('/v1/me/profile', profile);
    expect(res.status).toBe(200);
    expect(t.accounts.profiles.get(A)).toMatchObject({ birthYear: 1990, allergens: ['PEANUT'] });
  });

  it('rejects consent to an outdated version', async () => {
    expect((await t.a.post('/v1/me/consents', { ...consent, version: '2000-01-01' })).status).toBe(400);
  });

  it('deletes stored health data when consent is withdrawn', async () => {
    await t.a.post('/v1/me/consents', consent);
    await t.a.put('/v1/me/profile', profile);
    await t.a.post('/v1/me/consents', { ...consent, granted: false });
    expect(t.accounts.profiles.has(A)).toBe(false);
    expect((await t.a.put('/v1/me/profile', profile)).status).toBe(403);
  });

  it('validates profiles with the same rules as recommendations', async () => {
    await t.a.post('/v1/me/consents', consent);
    expect((await t.a.put('/v1/me/profile', { birthYear: new Date().getUTCFullYear() - 10 })).status).toBe(400);
  });
});

describe('claiming the on-device profile', () => {
  it('applies it to an account without a profile', async () => {
    await t.a.post('/v1/me/consents', consent);
    const res = await t.a.post('/v1/me/claim', { profile });
    expect(res.body.applied).toBe(true);
  });

  it("keeps the account's existing profile", async () => {
    await t.a.post('/v1/me/consents', consent);
    await t.a.put('/v1/me/profile', { ...profile, goal: 'EAT_HEALTHIER' });
    const res = await t.a.post('/v1/me/claim', { profile });
    expect(res.body).toMatchObject({ applied: false, profile: { goal: 'EAT_HEALTHIER' } });
  });
});

describe('data isolation between users', () => {
  it("never shows one user's profile or favourites to another", async () => {
    await t.a.post('/v1/me/consents', consent);
    await t.a.put('/v1/me/profile', profile);
    await t.a.put('/v1/me/favorites/waakye');

    const bMe = await t.b.get('/v1/me');
    expect(bMe.body.profile).toBeNull();
    expect((await t.b.get('/v1/me/favorites')).body.items).toEqual([]);
    expect((await t.a.get('/v1/me/favorites')).body.items.map((m: MealCard) => m.slug)).toEqual(['waakye']);
  });

  it('ignores any user id smuggled into the body', async () => {
    await t.b.post('/v1/me/consents', consent);
    const res = await t.b.put('/v1/me/profile', { ...profile, userId: A });
    expect(res.status).toBe(400); // strict schema: unknown fields are rejected
    expect(t.accounts.profiles.has(A)).toBe(false);
  });
});

describe('favourites', () => {
  it('adds, lists and removes favourites idempotently', async () => {
    await t.a.put('/v1/me/favorites/waakye');
    await t.a.put('/v1/me/favorites/waakye');
    await t.a.put('/v1/me/favorites/red-red');
    expect((await t.a.get('/v1/me/favorites')).body.items.map((m: MealCard) => m.slug)).toEqual(['red-red', 'waakye']);
    await t.a.del('/v1/me/favorites/waakye');
    expect((await t.a.get('/v1/me/favorites')).body.items.map((m: MealCard) => m.slug)).toEqual(['red-red']);
  });

  it('404s for unknown or malformed meals', async () => {
    expect((await t.a.put('/v1/me/favorites/pizza')).status).toBe(404);
    expect((await t.a.put('/v1/me/favorites/DROP%20TABLE')).status).toBe(404);
  });
});

describe('account deletion', () => {
  it('deletes the data first, then the sign-in account', async () => {
    await t.a.post('/v1/me/consents', consent);
    await t.a.put('/v1/me/profile', profile);
    const res = await t.a.del('/v1/me');
    expect(res.status).toBe(204);
    expect(t.accounts.users.has(A)).toBe(false);
    expect(t.accounts.profiles.has(A)).toBe(false);
    expect(t.authAdmin.deleteUser).toHaveBeenCalledWith(A);
  });

  it('reports failure if the sign-in account could not be deleted, so the user can retry', async () => {
    t.authAdmin.deleteUser.mockRejectedValueOnce(new Error('network'));
    expect((await t.a.del('/v1/me')).status).toBe(500);
    expect((await t.a.del('/v1/me')).status).toBe(204);
  });
});
