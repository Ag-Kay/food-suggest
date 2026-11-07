/**
 * Builds recommendation candidates from the real seed recipes and ingredient
 * tags (no database, no licensed nutrition data). Nutrition is left empty;
 * scoring tests use hand-made nutrition instead.
 */
import type { MealCard } from '@food-suggest/shared';

import { INGREDIENTS } from '../../../prisma/seed/ingredients.js';
import { MEALS } from '../../../prisma/seed/meals.js';
import { deriveAllergens, deriveDiet, type DerivableIngredient } from '../meals/derive.js';
import type { RecommendationCandidate } from './engine.js';

const bySlug = new Map(INGREDIENTS.map((i) => [i.slug, i]));

export function seedCandidates(): RecommendationCandidate[] {
  return MEALS.map((meal) => {
    const variant = meal.variants.find((v) => v.isDefault) ?? meal.variants[0]!;
    const derivable: DerivableIngredient[] = variant.ingredients.map((vi) => {
      const ing = bySlug.get(vi.slug)!;
      return {
        optional: vi.optional ?? false,
        diet: ing.diet,
        allergens: ing.allergens ?? [],
        allergensReviewed: ing.allergensReviewed ?? true,
      };
    });
    const allergenSummary = deriveAllergens(derivable);
    const card: MealCard = {
      slug: meal.slug,
      name: meal.name,
      localNames: meal.localNames ?? [],
      description: meal.description,
      cuisine: { slug: meal.cuisine, name: meal.cuisine },
      slots: meal.slots,
      imageUrl: null,
      totalMinutes: variant.prepMinutes + variant.cookMinutes,
      difficulty: variant.difficulty,
      diet: deriveDiet(derivable),
      allergens: allergenSummary.allergens,
      allergenInfoComplete: allergenSummary.allergenInfoComplete,
      nutrition: null,
    };
    return {
      card,
      requiredIngredients: variant.ingredients.filter((i) => !i.optional).map((i) => i.slug),
      optionalIngredients: variant.ingredients
        .filter((i) => i.optional)
        .map((i) => ({ slug: i.slug, name: bySlug.get(i.slug)!.name, allergens: bySlug.get(i.slug)!.allergens ?? [] })),
      ingredientNames: Object.fromEntries(variant.ingredients.map((i) => [i.slug, bySlug.get(i.slug)!.name])),
    };
  });
}

/** Allergens of every REQUIRED ingredient of a candidate, straight from the seed tags. */
export function requiredAllergensOf(c: RecommendationCandidate) {
  return new Set(c.requiredIngredients.flatMap((s) => bySlug.get(s)!.allergens ?? []));
}
