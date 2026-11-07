import { describe, expect, it } from 'vitest';

import { calculateVariantNutrition, type CalculatorIngredient } from './calculator.js';

// Round illustrative numbers — these tests check the maths, not real foods.
const rice: CalculatorIngredient = {
  slug: 'rice',
  grams: 200,
  optional: false,
  nutrients: { energyKcal: 350, proteinG: 7, carbsG: 78, fatG: 1, fibreG: 1, sodiumMg: 5 },
};
const oil: CalculatorIngredient = {
  slug: 'oil',
  grams: 20,
  optional: false,
  nutrients: { energyKcal: 900, proteinG: 0, carbsG: 0, fatG: 100, fibreG: 0, sodiumMg: 0 },
};

describe('calculateVariantNutrition', () => {
  it('sums ingredients by weight and divides by servings', () => {
    const r = calculateVariantNutrition([rice, oil], 2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // rice: 700 kcal, 14 P, 156 C, 2 F ; oil: 180 kcal, 20 F  → /2
    expect(r.perServing).toMatchObject({ energyKcal: 440, proteinG: 7, carbsG: 78, fatG: 11 });
    expect(r.perServing.fibreG).toBe(1);
    expect(r.rawGramsPerServing).toBe(110);
    expect(r.reliability).toBe('ESTIMATED');
  });

  it('excludes optional ingredients', () => {
    const garnish = { ...oil, slug: 'garnish', optional: true };
    const r = calculateVariantNutrition([rice, garnish], 1);
    expect(r.ok && r.perServing.energyKcal).toBe(700);
  });

  it('fails instead of under-counting when a required weight is missing', () => {
    const r = calculateVariantNutrition([rice, { ...oil, grams: null }], 1);
    expect(r).toMatchObject({ ok: false, reason: 'MISSING_DATA', missingGrams: ['oil'] });
  });

  it('fails when a required ingredient has no nutrient data', () => {
    const r = calculateVariantNutrition([rice, { ...oil, nutrients: null }], 1);
    expect(r).toMatchObject({ ok: false, missingNutrients: ['oil'] });
  });

  it('marks a secondary nutrient unknown if any ingredient lacks it', () => {
    const noFibre: CalculatorIngredient = {
      ...oil,
      slug: 'mystery',
      nutrients: { energyKcal: 100, proteinG: 1, carbsG: 1, fatG: 1 },
    };
    const r = calculateVariantNutrition([rice, noFibre], 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.perServing.fibreG).toBeNull();
    expect(r.unknownNutrients.fibreG).toEqual(['mystery']);
  });

  it('ignores missing secondary data on zero-gram ingredients', () => {
    const zero: CalculatorIngredient = {
      slug: 'salt-pinch',
      grams: 0,
      optional: false,
      nutrients: { energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    };
    const r = calculateVariantNutrition([rice, zero], 1);
    expect(r.ok && r.perServing.fibreG).toBe(2);
  });

  it('rejects zero servings and empty recipes', () => {
    expect(calculateVariantNutrition([rice], 0)).toMatchObject({ ok: false, reason: 'NO_SERVINGS' });
    expect(calculateVariantNutrition([{ ...rice, optional: true }], 1)).toMatchObject({
      ok: false,
      reason: 'NO_INGREDIENTS',
    });
  });
});
