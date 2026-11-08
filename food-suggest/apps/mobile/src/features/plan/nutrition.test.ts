import type { MealDetail } from '@food-suggest/shared';

import { sumDayNutrition } from './nutrition';

const meal = (slug: string, n: { kcal: number; protein: number; fibre: number | null } | null) =>
  ({
    slug,
    variants: [
      {
        isDefault: true,
        nutrition: n && {
          energyKcal: n.kcal,
          proteinG: n.protein,
          carbsG: 10,
          fatG: 5,
          fibreG: n.fibre,
          sugarsG: null,
          saturatedFatG: null,
          sodiumMg: null,
          method: 'CALCULATED',
          reliability: 'ESTIMATED',
        },
      },
    ],
  }) as unknown as MealDetail;

describe('sumDayNutrition', () => {
  it('counts one portion per planned meal', () => {
    const details = new Map([
      ['a', meal('a', { kcal: 500, protein: 30, fibre: 6 })],
      ['b', meal('b', { kcal: 300, protein: 10, fibre: 4 })],
    ]);
    expect(sumDayNutrition(['a', 'b', 'a'], details)).toMatchObject({
      counted: 3,
      missing: 0,
      energyKcal: 1300,
      proteinG: 70,
      carbsG: 30,
      fibreG: 16,
    });
  });

  it('reports meals without data instead of counting them as zero', () => {
    const details = new Map([['a', meal('a', { kcal: 500, protein: 30, fibre: null })], ['b', meal('b', null)]]);
    const day = sumDayNutrition(['a', 'b', 'not-loaded'], details);
    expect(day).toMatchObject({ counted: 1, missing: 2, energyKcal: 500, fibreG: null });
  });
});
