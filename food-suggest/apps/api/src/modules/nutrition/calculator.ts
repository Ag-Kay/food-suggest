/**
 * Calculates per-serving nutrition for a meal variant from its ingredients.
 *
 * Accuracy rules (deliberately strict — see docs/DECISIONS.md):
 * - A required ingredient without a gram weight or without nutrient data makes
 *   the whole calculation fail. We never silently under-count.
 * - Optional ingredients ("garnish", "to serve") are excluded from totals.
 * - Core nutrients (energy, protein, carbs, fat) must exist for every ingredient.
 *   Secondary nutrients (fibre, sugars, ...) become `null` ("unknown") if any
 *   contributing ingredient lacks them, instead of reporting a misleadingly low value.
 * - Energy is summed from the sources' own kcal values, not recomputed.
 * - The result is always an ESTIMATE: recipes vary between cooks.
 */

export const CORE_NUTRIENTS = ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const;
export const SECONDARY_NUTRIENTS = [
  'fibreG',
  'sugarsG',
  'saturatedFatG',
  'sodiumMg',
  'ironMg',
  'calciumMg',
] as const;

export type CoreNutrient = (typeof CORE_NUTRIENTS)[number];
export type SecondaryNutrient = (typeof SECONDARY_NUTRIENTS)[number];

/** Nutrients per 100 g of edible portion. */
export type NutrientsPer100g = Record<CoreNutrient, number> &
  Partial<Record<SecondaryNutrient, number | null>>;

export interface CalculatorIngredient {
  slug: string;
  /** Edible-portion grams in the whole recipe. */
  grams: number | null;
  optional: boolean;
  nutrients: NutrientsPer100g | null;
}

export type ServingNutrition = Record<CoreNutrient, number> & Record<SecondaryNutrient, number | null>;

export type CalculationResult =
  | {
      ok: true;
      perServing: ServingNutrition;
      /** Sum of raw ingredient grams per serving (not the cooked weight). */
      rawGramsPerServing: number;
      method: 'CALCULATED_FROM_INGREDIENTS';
      reliability: 'ESTIMATED';
      /** Secondary nutrients that are unknown, and which ingredients caused it. */
      unknownNutrients: Partial<Record<SecondaryNutrient, string[]>>;
    }
  | {
      ok: false;
      reason: 'NO_SERVINGS' | 'NO_INGREDIENTS' | 'MISSING_DATA';
      /** Required ingredients missing a weight or nutrient data. */
      missingGrams: string[];
      missingNutrients: string[];
    };

const ROUND_DP: Record<CoreNutrient | SecondaryNutrient, number> = {
  energyKcal: 0,
  proteinG: 1,
  carbsG: 1,
  fatG: 1,
  fibreG: 1,
  sugarsG: 1,
  saturatedFatG: 1,
  sodiumMg: 0,
  ironMg: 1,
  calciumMg: 0,
};

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function calculateVariantNutrition(
  ingredients: CalculatorIngredient[],
  servings: number,
): CalculationResult {
  if (!Number.isFinite(servings) || servings <= 0) {
    return { ok: false, reason: 'NO_SERVINGS', missingGrams: [], missingNutrients: [] };
  }

  const required = ingredients.filter((i) => !i.optional);
  if (required.length === 0) {
    return { ok: false, reason: 'NO_INGREDIENTS', missingGrams: [], missingNutrients: [] };
  }

  const missingGrams = required.filter((i) => i.grams == null || !(i.grams >= 0)).map((i) => i.slug);
  const missingNutrients = required
    .filter((i) => !i.nutrients || CORE_NUTRIENTS.some((n) => !Number.isFinite(i.nutrients![n])))
    .map((i) => i.slug);

  if (missingGrams.length || missingNutrients.length) {
    return { ok: false, reason: 'MISSING_DATA', missingGrams, missingNutrients };
  }

  const totals = Object.fromEntries(
    [...CORE_NUTRIENTS, ...SECONDARY_NUTRIENTS].map((n) => [n, 0]),
  ) as Record<CoreNutrient | SecondaryNutrient, number>;
  const unknownNutrients: Partial<Record<SecondaryNutrient, string[]>> = {};
  let rawGrams = 0;

  for (const ing of required) {
    const grams = ing.grams!;
    const n = ing.nutrients!;
    const factor = grams / 100;
    rawGrams += grams;

    for (const key of CORE_NUTRIENTS) totals[key] += n[key] * factor;

    for (const key of SECONDARY_NUTRIENTS) {
      const v = n[key];
      if (v == null || !Number.isFinite(v)) {
        // Zero grams contributes nothing, so a missing value doesn't matter.
        if (grams > 0) (unknownNutrients[key] ??= []).push(ing.slug);
      } else {
        totals[key] += v * factor;
      }
    }
  }

  const perServing = {} as ServingNutrition;
  for (const key of CORE_NUTRIENTS) perServing[key] = round(totals[key] / servings, ROUND_DP[key]);
  for (const key of SECONDARY_NUTRIENTS) {
    perServing[key] = unknownNutrients[key] ? null : round(totals[key] / servings, ROUND_DP[key]);
  }

  return {
    ok: true,
    perServing,
    rawGramsPerServing: round(rawGrams / servings, 0),
    method: 'CALCULATED_FROM_INGREDIENTS',
    reliability: 'ESTIMATED',
    unknownNutrients,
  };
}
