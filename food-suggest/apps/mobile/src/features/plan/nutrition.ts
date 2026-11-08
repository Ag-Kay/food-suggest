import type { MealDetail, NutritionSummary } from '@food-suggest/shared';

export interface DayNutrition {
  /** Meals with nutrition data that were counted. */
  counted: number;
  /** Planned meals we couldn't count (no data yet, or details not loaded). */
  missing: number;
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Null when any counted meal lacks fibre data (a partial sum would mislead). */
  fibreG: number | null;
}

export function defaultNutrition(meal: MealDetail | undefined): NutritionSummary | null {
  if (!meal) return null;
  return (meal.variants.find((v) => v.isDefault) ?? meal.variants[0])?.nutrition ?? null;
}

/**
 * Estimated intake for one person: ONE portion of each planned meal. Planned servings only
 * change how much to cook and buy, not how much one person eats.
 */
export function sumDayNutrition(slugs: string[], details: Map<string, MealDetail | undefined>): DayNutrition {
  const total: DayNutrition = { counted: 0, missing: 0, energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
  for (const slug of slugs) {
    const n = defaultNutrition(details.get(slug));
    if (!n) {
      total.missing += 1;
      continue;
    }
    total.counted += 1;
    total.energyKcal += n.energyKcal;
    total.proteinG += n.proteinG;
    total.carbsG += n.carbsG;
    total.fatG += n.fatG;
    total.fibreG = total.fibreG === null || n.fibreG === null ? null : total.fibreG + n.fibreG;
  }
  return total;
}
