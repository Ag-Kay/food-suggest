/**
 * Deterministic diet and allergen derivation for a meal variant.
 * This is safety logic: it must never depend on AI or on client input.
 */
import type { Allergen, MealDiet } from '@food-suggest/shared';

export type IngredientDiet = 'VEGAN' | 'VEGETARIAN' | 'PESCATARIAN' | 'OMNIVORE_ONLY';

export interface DerivableIngredient {
  optional: boolean;
  diet: IngredientDiet;
  allergens: Allergen[];
  allergensReviewed: boolean;
}

const DIET_RANK: Record<IngredientDiet, number> = {
  VEGAN: 0,
  VEGETARIAN: 1,
  PESCATARIAN: 2,
  OMNIVORE_ONLY: 3,
};
const RANK_TO_DIET: MealDiet[] = ['VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'OMNIVORE'];

/** The meal is only as plant-based as its least plant-based required ingredient. */
export function deriveDiet(ingredients: DerivableIngredient[]): MealDiet {
  const rank = ingredients
    .filter((i) => !i.optional)
    .reduce((max, i) => Math.max(max, DIET_RANK[i.diet]), 0);
  return RANK_TO_DIET[rank]!;
}

export interface AllergenSummary {
  allergens: Allergen[];
  optionalAllergens: Allergen[];
  allergenInfoComplete: boolean;
}

export function deriveAllergens(ingredients: DerivableIngredient[]): AllergenSummary {
  const required = new Set<Allergen>();
  const optional = new Set<Allergen>();
  for (const i of ingredients) {
    for (const a of i.allergens) (i.optional ? optional : required).add(a);
  }
  for (const a of required) optional.delete(a);
  return {
    allergens: [...required].sort(),
    optionalAllergens: [...optional].sort(),
    // Unknown allergen content anywhere (even optional) means we cannot vouch for the meal.
    allergenInfoComplete: ingredients.every((i) => i.allergensReviewed),
  };
}

/** Whether a meal's diet satisfies the user's chosen diet. */
export function dietSatisfies(meal: MealDiet, wanted: 'OMNIVORE' | 'VEGETARIAN' | 'VEGAN' | 'PESCATARIAN'): boolean {
  const order: MealDiet[] = ['VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'OMNIVORE'];
  if (wanted === 'OMNIVORE') return true;
  if (wanted === 'PESCATARIAN') return meal !== 'OMNIVORE';
  return order.indexOf(meal) <= order.indexOf(wanted);
}
