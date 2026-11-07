import { describe, expect, it } from 'vitest';

import { Allergen, DietType, type MealCard, type ProfileInput } from '@food-suggest/shared';

import { recommend, type RecommendationCandidate } from './engine.js';
import { requiredAllergensOf, seedCandidates } from './seed-candidates.test-helper.js';

const NOW = new Date('2026-11-07T12:00:00Z');
const adult = (over: Partial<ProfileInput> = {}): ProfileInput => ({
  birthYear: 1990,
  allergens: [],
  avoidIngredients: [],
  likedIngredients: [],
  dislikedIngredients: [],
  cuisines: [],
  preferredSlots: [],
  showCalories: false,
  ...over,
});

const candidates = seedCandidates();
const ALL = { limit: 20, now: NOW };

describe('allergy safety (every allergen × every seeded meal)', () => {
  it.each(Allergen.options)('never recommends a meal containing %s', (allergen) => {
    const { items } = recommend(candidates, adult({ allergens: [allergen] }), ALL);
    for (const r of items) {
      const c = candidates.find((x) => x.card.slug === r.meal.slug)!;
      expect(requiredAllergensOf(c).has(allergen)).toBe(false);
      expect(r.meal.allergens).not.toContain(allergen);
    }
  });

  it('excludes meals with unknown (brand-dependent) allergens for anyone with an allergy', () => {
    const { items } = recommend(candidates, adult({ allergens: ['SESAME'] }), ALL);
    expect(items.every((r) => r.meal.allergenInfoComplete)).toBe(true);
    expect(items.map((r) => r.meal.slug)).not.toContain('jollof-rice-chicken'); // curry powder, stock cube
  });

  it('keeps those meals for users without allergies', () => {
    const { items } = recommend(candidates, adult(), ALL);
    expect(items.map((r) => r.meal.slug)).toContain('jollof-rice-chicken');
  });

  it('handles several allergens at once', () => {
    const allergens: Allergen[] = ['FISH', 'PEANUT', 'EGG'];
    const { items } = recommend(candidates, adult({ allergens }), ALL);
    expect(items.length).toBeGreaterThan(0);
    for (const r of items) expect(r.meal.allergens.some((a) => allergens.includes(a))).toBe(false);
  });

  it('warns about allergens in optional extras instead of hiding the meal', () => {
    const { items } = recommend(candidates, adult({ allergens: ['FISH'] }), ALL);
    const waakye = items.find((r) => r.meal.slug === 'waakye');
    expect(waakye).toBeDefined();
    expect(waakye!.cautions.join(' ')).toMatch(/Leave out the shito.*fish/i);
  });

  it('counts excluded meals', () => {
    const r = recommend(candidates, adult({ allergens: ['FISH'] }), ALL);
    expect(r.excludedCount).toBeGreaterThan(0);
    expect(r.items.length + r.excludedCount).toBe(candidates.length);
  });
});

describe('diet filtering', () => {
  const RANK = { VEGAN: 0, VEGETARIAN: 1, PESCATARIAN: 2, OMNIVORE: 3 } as const;

  it.each(DietType.options)('only returns meals compatible with %s', (dietType) => {
    const { items } = recommend(candidates, adult({ dietType }), ALL);
    expect(items.length).toBeGreaterThan(0);
    for (const r of items) {
      if (dietType === 'PESCATARIAN') expect(r.meal.diet).not.toBe('OMNIVORE');
      else if (dietType !== 'OMNIVORE') expect(RANK[r.meal.diet]).toBeLessThanOrEqual(RANK[dietType]);
    }
  });

  it('vegan returns exactly the plant-based seed meals', () => {
    const slugs = recommend(candidates, adult({ dietType: 'VEGAN' }), ALL).items.map((r) => r.meal.slug).sort();
    expect(slugs).toEqual(['hausa-koko', 'kelewele', 'red-red']);
  });
});

describe('other hard filters', () => {
  it('removes meals with avoided ingredients', () => {
    const { items } = recommend(candidates, adult({ avoidIngredients: ['cowpea'] }), ALL);
    expect(items.map((r) => r.meal.slug)).not.toContain('red-red');
    expect(items.map((r) => r.meal.slug)).not.toContain('waakye');
  });

  it('respects maximum cooking time', () => {
    const { items } = recommend(candidates, adult({ maxCookMinutes: 30 }), ALL);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((r) => r.meal.totalMinutes <= 30)).toBe(true);
  });

  it('filters by meal slot without counting them as excluded', () => {
    const r = recommend(candidates, adult(), { ...ALL, slot: 'BREAKFAST' });
    expect(r.items.every((x) => x.meal.slots.includes('BREAKFAST'))).toBe(true);
    expect(r.excludedCount).toBe(0);
  });
});

// ── Scoring with hand-made nutrition ─────────────────────────────────────────

function candidate(slug: string, n: Partial<NonNullable<MealCard['nutrition']>>, over: Partial<MealCard> = {}): RecommendationCandidate {
  return {
    card: {
      slug,
      name: slug,
      localNames: [],
      description: '',
      cuisine: { slug: 'ghanaian', name: 'Ghanaian' },
      slots: ['LUNCH'],
      imageUrl: null,
      totalMinutes: 45,
      difficulty: 'BEGINNER',
      diet: 'OMNIVORE',
      allergens: [],
      allergenInfoComplete: true,
      nutrition: {
        energyKcal: 600,
        proteinG: 20,
        carbsG: 60,
        fatG: 20,
        fibreG: 4,
        sugarsG: null,
        saturatedFatG: null,
        sodiumMg: 500,
        method: 'CALCULATED_FROM_INGREDIENTS',
        reliability: 'ESTIMATED',
        ...n,
      },
      ...over,
    },
    requiredIngredients: [],
    optionalIngredients: [],
    ingredientNames: {},
  };
}

describe('goal scoring', () => {
  const highProtein = candidate('high-protein', { proteinG: 45, energyKcal: 500 });
  const lowProtein = candidate('low-protein', { proteinG: 8, energyKcal: 500 });
  const light = candidate('light', { energyKcal: 420, fibreG: 9, proteinG: 30 });
  const heavy = candidate('heavy', { energyKcal: 900, proteinG: 25 });

  it('ranks high-protein meals first for muscle building, with a factual reason', () => {
    const r = recommend([lowProtein, highProtein], adult({ goal: 'BUILD_MUSCLE' }), { now: NOW });
    expect(r.items[0]!.meal.slug).toBe('high-protein');
    expect(r.items[0]!.reasons[0]).toBe('About 45 g of protein per serving, useful for your muscle-building goal.');
  });

  it('prefers lighter, fibre-rich meals for adult weight loss', () => {
    const r = recommend([heavy, light], adult({ goal: 'LOSE_WEIGHT' }), { now: NOW });
    expect(r.items[0]!.meal.slug).toBe('light');
  });

  it('prefers energy-rich meals for weight gain', () => {
    const r = recommend([light, heavy], adult({ goal: 'GAIN_WEIGHT' }), { now: NOW });
    expect(r.items[0]!.meal.slug).toBe('heavy');
  });

  it('never gives weight-loss framing to under-18s', () => {
    const r = recommend([heavy, light], adult({ goal: 'LOSE_WEIGHT', birthYear: 2009 }), { now: NOW });
    expect(r.notes[0]).toMatch(/under 18/);
    expect(r.items.flatMap((x) => x.reasons).join(' ')).not.toMatch(/lighter meal/i);
  });

  it('only mentions calories when the user opted in', () => {
    const hidden = recommend([light], adult({ goal: 'LOSE_WEIGHT' }), { now: NOW }).items[0]!.reasons.join(' ');
    const shown = recommend([light], adult({ goal: 'LOSE_WEIGHT', showCalories: true }), { now: NOW }).items[0]!.reasons.join(' ');
    expect(hidden).not.toMatch(/kcal/);
    expect(shown).toMatch(/420 kcal/);
  });

  it('boosts liked cuisines and ingredients, and explains why', () => {
    const plain = candidate('plain', {});
    const liked = { ...candidate('liked', {}), requiredIngredients: ['groundnut-paste'], ingredientNames: { 'groundnut-paste': 'Groundnut paste' } };
    const r = recommend([plain, liked], adult({ likedIngredients: ['groundnut-paste'] }), { now: NOW });
    expect(r.items[0]!.meal.slug).toBe('liked');
    expect(r.items[0]!.reasons).toContain('Made with groundnut paste, which you like.');
  });

  it('cautions when a meal is above the user’s cooking skill', () => {
    const hard = candidate('hard', {}, { difficulty: 'ADVANCED' });
    const r = recommend([hard], adult({ cookingSkill: 'BEGINNER' }), { now: NOW });
    expect(r.items[0]!.cautions).toContain('A bit more involved than your usual cooking.');
  });

  it('flags salty meals', () => {
    const salty = candidate('salty', { sodiumMg: 1300 });
    expect(recommend([salty], adult(), { now: NOW }).items[0]!.cautions[0]).toMatch(/salt/);
  });

  it('keeps scores within 0–100 and gives at most 3 reasons', () => {
    const r = recommend(candidates.concat([highProtein, light, heavy]), adult({ goal: 'BUILD_MUSCLE', dietType: 'OMNIVORE' }), { ...ALL, limit: 50 });
    for (const x of r.items) {
      expect(x.score).toBeGreaterThanOrEqual(0);
      expect(x.score).toBeLessThanOrEqual(100);
      expect(x.reasons.length).toBeLessThanOrEqual(3);
    }
  });
});
