import { describe, expect, it } from 'vitest';

import { deriveAllergens, deriveDiet, dietSatisfies, type DerivableIngredient } from './derive.js';

const ing = (over: Partial<DerivableIngredient>): DerivableIngredient => ({
  optional: false,
  diet: 'VEGAN',
  allergens: [],
  allergensReviewed: true,
  ...over,
});

describe('deriveDiet', () => {
  it('takes the least plant-based required ingredient', () => {
    expect(deriveDiet([ing({}), ing({ diet: 'VEGETARIAN' })])).toBe('VEGETARIAN');
    expect(deriveDiet([ing({}), ing({ diet: 'PESCATARIAN' }), ing({ diet: 'VEGETARIAN' })])).toBe('PESCATARIAN');
    expect(deriveDiet([ing({ diet: 'OMNIVORE_ONLY' })])).toBe('OMNIVORE');
  });

  it('ignores optional ingredients (e.g. shito on waakye)', () => {
    expect(deriveDiet([ing({}), ing({ diet: 'PESCATARIAN', optional: true })])).toBe('VEGAN');
  });
});

describe('deriveAllergens', () => {
  it('separates required and optional-only allergens', () => {
    const r = deriveAllergens([
      ing({ allergens: ['EGG'] }),
      ing({ optional: true, allergens: ['FISH', 'CRUSTACEAN', 'EGG'] }),
    ]);
    expect(r.allergens).toEqual(['EGG']);
    expect(r.optionalAllergens).toEqual(['CRUSTACEAN', 'FISH']);
  });

  it('marks info incomplete if any ingredient is unreviewed, even optional', () => {
    expect(deriveAllergens([ing({}), ing({ optional: true, allergensReviewed: false })]).allergenInfoComplete).toBe(false);
    expect(deriveAllergens([ing({})]).allergenInfoComplete).toBe(true);
  });
});

describe('dietSatisfies', () => {
  it('applies diet ordering', () => {
    expect(dietSatisfies('VEGAN', 'VEGETARIAN')).toBe(true);
    expect(dietSatisfies('VEGETARIAN', 'VEGAN')).toBe(false);
    expect(dietSatisfies('VEGETARIAN', 'PESCATARIAN')).toBe(true);
    expect(dietSatisfies('PESCATARIAN', 'VEGETARIAN')).toBe(false);
    expect(dietSatisfies('OMNIVORE', 'PESCATARIAN')).toBe(false);
    expect(dietSatisfies('OMNIVORE', 'OMNIVORE')).toBe(true);
  });
});
