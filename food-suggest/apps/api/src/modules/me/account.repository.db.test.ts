/**
 * Runs the real account repository against a seeded development database.
 * Enabled with RUN_DB_TESTS=1 (needs `pnpm db:dev` and `pnpm db:setup`).
 * Uses random user ids and deletes them afterwards.
 */
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HEALTH_DATA_CONSENT_VERSION, type ProfileInput } from '@food-suggest/shared';

import { createDb, type Db } from '../../lib/db.js';
import { createAccountRepository, type AccountRepository } from './account.repository.js';

const enabled = process.env.RUN_DB_TESTS === '1';

describe.skipIf(!enabled)('account repository (database)', () => {
  let db: Db;
  let repo: AccountRepository;
  const a = randomUUID();
  const b = randomUUID();

  const profile: ProfileInput = {
    birthYear: 1990,
    goal: 'BUILD_MUSCLE',
    dietType: 'VEGETARIAN',
    allergens: ['PEANUT', 'FISH'],
    avoidIngredients: ['goat-meat'],
    likedIngredients: ['plantain-ripe'],
    dislikedIngredients: [],
    cuisines: ['ghanaian'],
    preferredSlots: ['BREAKFAST'],
    maxCookMinutes: 60,
    cookingSkill: 'BEGINNER',
    showCalories: true,
  };

  beforeAll(async () => {
    try {
      process.loadEnvFile();
    } catch {
      // use the environment
    }
    db = createDb(process.env.DATABASE_URL!);
    repo = createAccountRepository(db);
    await repo.ensureUser({ userId: a, email: null });
    await repo.ensureUser({ userId: b, email: null });
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: [a, b] } } });
    await db.$disconnect();
  });

  it('round-trips a full profile', async () => {
    await repo.saveProfile(a, profile);
    expect(await repo.getProfile(a)).toEqual({
      ...profile,
      allergens: ['FISH', 'PEANUT'],
      heightCm: undefined,
      weightKg: undefined,
      sex: undefined,
      activityLevel: undefined,
      mealsPerDay: undefined,
      budget: undefined,
    });
  });

  it('rejects unknown ingredient slugs', async () => {
    await expect(repo.saveProfile(a, { ...profile, avoidIngredients: ['unicorn'] })).rejects.toThrow(/Unknown ingredient/);
  });

  it('keeps users isolated', async () => {
    await repo.addFavorite(a, 'waakye');
    expect(await repo.getProfile(b)).toBeNull();
    expect(await repo.listFavoriteSlugs(b)).toEqual([]);
    expect(await repo.listFavoriteSlugs(a)).toEqual(['waakye']);
    await repo.removeFavorite(b, 'waakye'); // must not touch A's favourite
    expect(await repo.listFavoriteSlugs(a)).toEqual(['waakye']);
  });

  it('tracks the latest health-data consent', async () => {
    expect((await repo.healthConsent(a)).granted).toBe(false);
    await repo.recordConsent(a, 'HEALTH_DATA', HEALTH_DATA_CONSENT_VERSION, true);
    expect((await repo.healthConsent(a)).granted).toBe(true);
    await repo.recordConsent(a, 'HEALTH_DATA', HEALTH_DATA_CONSENT_VERSION, false);
    expect((await repo.healthConsent(a)).granted).toBe(false);
  });

  it('deleting a user removes all of their data and nobody else’s', async () => {
    await repo.saveProfile(b, { ...profile, allergens: [] });
    await repo.deleteUserData(a);
    const [user, prof, allergens, prefs, favs, consents] = await Promise.all([
      db.user.findUnique({ where: { id: a } }),
      db.profile.findUnique({ where: { userId: a } }),
      db.userAllergen.count({ where: { userId: a } }),
      db.userIngredientPref.count({ where: { userId: a } }),
      db.favorite.count({ where: { userId: a } }),
      db.consent.count({ where: { userId: a } }),
    ]);
    expect({ user, prof, allergens, prefs, favs, consents }).toEqual({ user: null, prof: null, allergens: 0, prefs: 0, favs: 0, consents: 0 });
    expect(await repo.getProfile(b)).not.toBeNull();
  });
});
