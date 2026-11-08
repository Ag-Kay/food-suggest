/**
 * Data access for the signed-in user's private data. Every method takes the
 * user id from the verified token; there is no way to address another user.
 */
import { HEALTH_DATA_CONSENT_VERSION, type ConsentType, type ProfileInput } from '@food-suggest/shared';

import type { Db } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import type { AuthContext } from '../auth/verify-token.js';

export interface AccountRepository {
  ensureUser(auth: AuthContext): Promise<void>;
  getProfile(userId: string): Promise<ProfileInput | null>;
  saveProfile(userId: string, profile: ProfileInput): Promise<void>;
  deleteProfile(userId: string): Promise<void>;
  recordConsent(userId: string, type: ConsentType, version: string, granted: boolean): Promise<void>;
  healthConsent(userId: string): Promise<{ granted: boolean; version: string | null }>;
  listFavoriteSlugs(userId: string): Promise<string[]>;
  addFavorite(userId: string, mealSlug: string): Promise<void>;
  removeFavorite(userId: string, mealSlug: string): Promise<void>;
  deleteUserData(userId: string): Promise<void>;
}

const num = (v: { toString(): string } | null) => (v == null ? undefined : Number(v));

export function createAccountRepository(db: Db): AccountRepository {
  async function slugIds(model: 'ingredient' | 'cuisine', slugs: string[]): Promise<Map<string, string>> {
    if (!slugs.length) return new Map();
    const rows =
      model === 'ingredient'
        ? await db.ingredient.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } })
        : await db.cuisine.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
    const map = new Map(rows.map((r) => [r.slug, r.id]));
    const unknown = slugs.filter((s) => !map.has(s));
    if (unknown.length) throw HttpError.badRequest(`Unknown ${model}: ${unknown.slice(0, 5).join(', ')}`);
    return map;
  }

  return {
    async ensureUser({ userId, email }) {
      await db.user.upsert({
        where: { id: userId },
        create: { id: userId, email },
        update: email ? { email } : {},
      });
    },

    async getProfile(userId) {
      const p = await db.profile.findUnique({ where: { userId } });
      if (!p) return null;
      const [allergens, prefs, cuisines] = await Promise.all([
        db.userAllergen.findMany({ where: { userId } }),
        db.userIngredientPref.findMany({ where: { userId }, include: { ingredient: { select: { slug: true } } } }),
        db.userCuisinePref.findMany({ where: { userId }, include: { cuisine: { select: { slug: true } } } }),
      ]);
      const prefSlugs = (kind: 'LIKE' | 'DISLIKE' | 'AVOID') =>
        prefs.filter((x) => x.preference === kind).map((x) => x.ingredient.slug).sort();
      return {
        birthYear: p.birthYear,
        heightCm: num(p.heightCm),
        weightKg: num(p.weightKg),
        sex: p.sex ?? undefined,
        activityLevel: p.activityLevel ?? undefined,
        goal: p.goal ?? undefined,
        dietType: p.dietType ?? undefined,
        allergens: allergens.map((a) => a.allergen).sort(),
        avoidIngredients: prefSlugs('AVOID'),
        likedIngredients: prefSlugs('LIKE'),
        dislikedIngredients: prefSlugs('DISLIKE'),
        cuisines: cuisines.map((c) => c.cuisine.slug).sort(),
        mealsPerDay: p.mealsPerDay ?? undefined,
        preferredSlots: p.preferredSlots,
        maxCookMinutes: p.maxCookMinutes ?? undefined,
        cookingSkill: p.cookingSkill ?? undefined,
        budget: p.budget ?? undefined,
        showCalories: p.showCalories,
      };
    },

    async saveProfile(userId, input) {
      const ingredientSlugs = [...new Set([...input.avoidIngredients, ...input.likedIngredients, ...input.dislikedIngredients])];
      const [ingredientIds, cuisineIds] = await Promise.all([
        slugIds('ingredient', ingredientSlugs),
        slugIds('cuisine', input.cuisines),
      ]);
      // AVOID wins over DISLIKE wins over LIKE if a slug appears twice.
      const prefs = new Map<string, 'LIKE' | 'DISLIKE' | 'AVOID'>();
      for (const s of input.likedIngredients) prefs.set(s, 'LIKE');
      for (const s of input.dislikedIngredients) prefs.set(s, 'DISLIKE');
      for (const s of input.avoidIngredients) prefs.set(s, 'AVOID');

      const data = {
        birthYear: input.birthYear,
        heightCm: input.heightCm ?? null,
        weightKg: input.weightKg ?? null,
        sex: input.sex ?? null,
        activityLevel: input.activityLevel ?? null,
        goal: input.goal ?? null,
        dietType: input.dietType ?? null,
        mealsPerDay: input.mealsPerDay ?? null,
        preferredSlots: input.preferredSlots,
        maxCookMinutes: input.maxCookMinutes ?? null,
        cookingSkill: input.cookingSkill ?? null,
        budget: input.budget ?? null,
        showCalories: input.showCalories,
      };

      await db.$transaction([
        db.profile.upsert({ where: { userId }, create: { userId, ...data }, update: data }),
        db.userAllergen.deleteMany({ where: { userId } }),
        db.userAllergen.createMany({ data: input.allergens.map((allergen) => ({ userId, allergen })) }),
        db.userIngredientPref.deleteMany({ where: { userId } }),
        db.userIngredientPref.createMany({
          data: [...prefs].map(([slug, preference]) => ({ userId, ingredientId: ingredientIds.get(slug)!, preference })),
        }),
        db.userCuisinePref.deleteMany({ where: { userId } }),
        db.userCuisinePref.createMany({ data: input.cuisines.map((s) => ({ userId, cuisineId: cuisineIds.get(s)! })) }),
      ]);
    },

    async deleteProfile(userId) {
      await db.$transaction([
        db.userAllergen.deleteMany({ where: { userId } }),
        db.userIngredientPref.deleteMany({ where: { userId } }),
        db.userCuisinePref.deleteMany({ where: { userId } }),
        db.profile.deleteMany({ where: { userId } }),
      ]);
    },

    async recordConsent(userId, type, version, granted) {
      await db.consent.create({ data: { userId, type, version, granted } });
    },

    async healthConsent(userId) {
      const latest = await db.consent.findFirst({
        where: { userId, type: 'HEALTH_DATA' },
        orderBy: { createdAt: 'desc' },
      });
      return {
        granted: !!latest?.granted && latest.version === HEALTH_DATA_CONSENT_VERSION,
        version: latest?.version ?? null,
      };
    },

    async listFavoriteSlugs(userId) {
      const rows = await db.favorite.findMany({
        where: { userId, meal: { status: 'PUBLISHED' } },
        orderBy: { createdAt: 'desc' },
        select: { meal: { select: { slug: true } } },
      });
      return rows.map((r) => r.meal.slug);
    },

    async addFavorite(userId, mealSlug) {
      const meal = await db.meal.findFirst({ where: { slug: mealSlug, status: 'PUBLISHED' }, select: { id: true } });
      if (!meal) throw HttpError.notFound('Meal not found');
      await db.favorite.upsert({
        where: { userId_mealId: { userId, mealId: meal.id } },
        create: { userId, mealId: meal.id },
        update: {},
      });
    },

    async removeFavorite(userId, mealSlug) {
      await db.favorite.deleteMany({ where: { userId, meal: { slug: mealSlug } } });
    },

    async deleteUserData(userId) {
      // Cascades to profile, preferences, consents, favourites, plans and lists.
      await db.user.deleteMany({ where: { id: userId } });
    },
  };
}
