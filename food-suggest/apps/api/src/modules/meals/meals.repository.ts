import type {
  MealCard,
  MealDetail,
  MealListQuery,
  MealListResponse,
  MealVariantDetail,
  NutritionSummary,
} from '@food-suggest/shared';

import type { Prisma } from '../../generated/prisma/client.ts';
import type { Db } from '../../lib/db.js';
import type { RecommendationCandidate } from '../recommendations/engine.js';
import { deriveAllergens, deriveDiet, dietSatisfies, type DerivableIngredient } from './derive.js';

export interface MealsRepository {
  list(query: MealListQuery): Promise<MealListResponse>;
  getBySlug(slug: string): Promise<MealDetail | null>;
  /** Every published meal's default variant, prepared for the recommendation engine. */
  listCandidates(): Promise<RecommendationCandidate[]>;
  /** Cards for the given slugs, in the given order (unknown or unpublished slugs are skipped). */
  cardsBySlugs(slugs: string[]): Promise<MealCard[]>;
}

const variantInclude = {
  nutrition: true,
  steps: { orderBy: { position: 'asc' } },
  ingredients: {
    orderBy: { position: 'asc' },
    include: {
      ingredient: { include: { allergens: true, nutrients: { include: { source: true } } } },
    },
  },
} satisfies Prisma.MealVariantInclude;

type VariantRow = Prisma.MealVariantGetPayload<{ include: typeof variantInclude }>;

const num = (v: Prisma.Decimal | number | null | undefined) => (v == null ? null : Number(v));

function toDerivable(v: VariantRow): DerivableIngredient[] {
  return v.ingredients.map((vi) => ({
    optional: vi.optional,
    diet: vi.ingredient.dietCompatibility,
    allergens: vi.ingredient.allergens.map((a) => a.allergen),
    allergensReviewed: vi.ingredient.allergensReviewed,
  }));
}

function toNutrition(v: VariantRow): NutritionSummary | null {
  const n = v.nutrition;
  if (!n) return null;
  return {
    energyKcal: Number(n.energyKcal),
    proteinG: Number(n.proteinG),
    carbsG: Number(n.carbsG),
    fatG: Number(n.fatG),
    fibreG: num(n.fibreG),
    sugarsG: num(n.sugarsG),
    saturatedFatG: num(n.saturatedFatG),
    sodiumMg: num(n.sodiumMg),
    method: n.method,
    reliability: n.reliability,
  };
}

function toVariantDetail(v: VariantRow): MealVariantDetail {
  const derivable = toDerivable(v);
  const nutrition = toNutrition(v);
  return {
    id: v.id,
    name: v.name,
    isDefault: v.isDefault,
    servings: v.servings,
    prepMinutes: v.prepMinutes,
    cookMinutes: v.cookMinutes,
    difficulty: v.difficulty,
    notes: v.notes,
    recipeReviewed: v.recipeReviewed,
    diet: deriveDiet(derivable),
    ...deriveAllergens(derivable),
    ingredients: v.ingredients.map((vi) => ({
      slug: vi.ingredient.slug,
      name: vi.ingredient.name,
      quantity: Number(vi.quantity),
      unit: vi.unit,
      grams: num(vi.grams),
      optional: vi.optional,
      note: vi.note,
      allergens: vi.ingredient.allergens.map((a) => a.allergen),
    })),
    steps: v.steps.map((s) => s.text),
    nutrition: nutrition && { ...nutrition, rawGramsPerServing: Number(v.nutrition!.rawGramsPerServing) },
    nutritionSources: v.ingredients
      .filter((vi) => vi.ingredient.nutrients)
      .map((vi) => {
        const n = vi.ingredient.nutrients!;
        return {
          ingredient: vi.ingredient.name,
          source: n.source.name,
          sourceRef: n.sourceRef,
          match: n.matchQuality,
          matchNote: n.matchNote,
        };
      }),
  };
}

function toCard(
  m: { slug: string; name: string; localNames: string[]; description: string; slots: MealCard['slots']; cuisine: { slug: string; name: string } },
  v: VariantRow,
): MealCard {
  const derivable = toDerivable(v);
  const allergenSummary = deriveAllergens(derivable);
  return {
    slug: m.slug,
    name: m.name,
    localNames: m.localNames,
    description: m.description,
    cuisine: { slug: m.cuisine.slug, name: m.cuisine.name },
    slots: m.slots,
    imageUrl: null,
    totalMinutes: v.prepMinutes + v.cookMinutes,
    difficulty: v.difficulty,
    diet: deriveDiet(derivable),
    allergens: allergenSummary.allergens,
    allergenInfoComplete: allergenSummary.allergenInfoComplete,
    nutrition: toNutrition(v),
  };
}

const pickDefault = <T extends { isDefault: boolean }>(variants: T[]): T | undefined =>
  variants.find((v) => v.isDefault) ?? variants[0];

export function createMealsRepository(db: Db): MealsRepository {
  return {
    async list(query) {
      const where: Prisma.MealWhereInput = {
        status: 'PUBLISHED',
        ...(query.cuisine && { cuisine: { slug: query.cuisine } }),
        ...(query.category && { categories: { some: { category: { slug: query.category } } } }),
        ...(query.slot && { slots: { has: query.slot } }),
        ...(query.q && {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
            { localNames: { has: query.q } },
          ],
        }),
      };

      const meals = await db.meal.findMany({
        where,
        orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
        include: { cuisine: true, image: true, variants: { include: variantInclude } },
      });

      // Diet and time depend on derived data, so they are filtered here.
      // Fine for hundreds of meals; precompute columns when the catalogue grows.
      const cards: MealCard[] = [];
      for (const m of meals) {
        const v = pickDefault(m.variants);
        if (!v) continue;
        const card = toCard(m, v);
        if (query.diet && !dietSatisfies(card.diet, query.diet)) continue;
        if (query.maxMinutes && card.totalMinutes > query.maxMinutes) continue;
        cards.push(card);
      }

      return {
        items: cards.slice(query.offset, query.offset + query.limit),
        total: cards.length,
        limit: query.limit,
        offset: query.offset,
      };
    },

    async listCandidates() {
      const meals = await db.meal.findMany({
        where: { status: 'PUBLISHED' },
        include: { cuisine: true, variants: { include: variantInclude } },
      });
      return meals.flatMap((m) => {
        const v = pickDefault(m.variants);
        if (!v) return [];
        return [
          {
            card: toCard(m, v),
            requiredIngredients: v.ingredients.filter((i) => !i.optional).map((i) => i.ingredient.slug),
            optionalIngredients: v.ingredients
              .filter((i) => i.optional)
              .map((i) => ({
                slug: i.ingredient.slug,
                name: i.ingredient.name,
                allergens: i.ingredient.allergens.map((a) => a.allergen),
              })),
            ingredientNames: Object.fromEntries(v.ingredients.map((i) => [i.ingredient.slug, i.ingredient.name])),
          },
        ];
      });
    },

    async cardsBySlugs(slugs) {
      if (!slugs.length) return [];
      const meals = await db.meal.findMany({
        where: { slug: { in: slugs }, status: 'PUBLISHED' },
        include: { cuisine: true, variants: { include: variantInclude } },
      });
      const bySlug = new Map(
        meals.flatMap((m) => {
          const v = pickDefault(m.variants);
          return v ? [[m.slug, toCard(m, v)] as const] : [];
        }),
      );
      return slugs.flatMap((s) => (bySlug.has(s) ? [bySlug.get(s)!] : []));
    },

    async getBySlug(slug) {
      const m = await db.meal.findFirst({
        where: { slug, status: 'PUBLISHED' },
        include: {
          cuisine: true,
          image: true,
          categories: { include: { category: true } },
          variants: { include: variantInclude, orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
        },
      });
      if (!m) return null;
      return {
        slug: m.slug,
        name: m.name,
        localNames: m.localNames,
        description: m.description,
        cuisine: { slug: m.cuisine.slug, name: m.cuisine.name },
        slots: m.slots,
        imageUrl: null,
        categories: m.categories.map((c) => ({ slug: c.category.slug, name: c.category.name })),
        variants: m.variants.map(toVariantDetail),
      };
    },
  };
}
