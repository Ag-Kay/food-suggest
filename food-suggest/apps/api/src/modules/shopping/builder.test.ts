import { compareCategories } from '@food-suggest/shared';
import { describe, expect, it } from 'vitest';

import { buildShoppingList, type RecipeForShopping } from './builder.js';
import { seedRecipes } from './seed-recipes.test-helper.js';

const ing = (slug: string, quantity: number, unit: string, extra: Partial<RecipeForShopping['ingredients'][number]> = {}) => ({
  slug,
  name: slug,
  category: 'Vegetables',
  quantity,
  unit,
  optional: false,
  ...extra,
});

const recipe = (slug: string, servings: number, ingredients: RecipeForShopping['ingredients']): RecipeForShopping => ({
  slug,
  name: `Meal ${slug}`,
  servings,
  ingredients,
});

const map = (...rs: RecipeForShopping[]) => new Map(rs.map((r) => [r.slug, r]));

describe('buildShoppingList', () => {
  it('scales by planned servings', () => {
    const list = buildShoppingList([{ slug: 'a', servings: 2 }], map(recipe('a', 4, [ing('rice', 400, 'g')])));
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({ quantity: 200, unit: 'g', amountText: '200 g' });
  });

  it('adds up the same ingredient across meals and units of the same family', () => {
    const list = buildShoppingList(
      [
        { slug: 'a', servings: 4 },
        { slug: 'b', servings: 1 },
      ],
      map(recipe('a', 4, [ing('onion', 0.5, 'kg')]), recipe('b', 1, [ing('onion', 120, 'g')])),
    );
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({ quantity: 620, unit: 'g', amountText: '620 g', meals: ['Meal a', 'Meal b'] });
  });

  it('never combines different unit families', () => {
    const list = buildShoppingList(
      [
        { slug: 'a', servings: 1 },
        { slug: 'b', servings: 1 },
      ],
      map(recipe('a', 1, [ing('oil', 2, 'tbsp')]), recipe('b', 1, [ing('oil', 50, 'g')])),
    );
    expect(list.items.map((i) => i.amountText).sort()).toEqual(['2 tbsp', '50 g']);
  });

  it('adds spoons and cups together as volume', () => {
    const list = buildShoppingList([{ slug: 'a', servings: 1 }], map(recipe('a', 1, [ing('oil', 1, 'tbsp'), ing('oil', 1, 'cup')])));
    expect(list.items).toEqual([expect.objectContaining({ quantity: 255, unit: 'ml', amountText: '1.25 cups' })]);
  });

  it('only adds identical unknown units', () => {
    const list = buildShoppingList(
      [{ slug: 'a', servings: 1 }],
      map(recipe('a', 1, [ing('leaves', 1, 'bunch'), ing('leaves', 2, 'bunch'), ing('leaves', 1, 'handful')])),
    );
    expect(list.items.map((i) => i.amountText).sort()).toEqual(['1 handful', '3 bunch']);
  });

  it('folds "to taste" into a measured line, and keeps it when there is none', () => {
    const merged = buildShoppingList(
      [
        { slug: 'a', servings: 1 },
        { slug: 'b', servings: 1 },
      ],
      map(recipe('a', 1, [ing('salt', 1, 'pinch')]), recipe('b', 1, [ing('salt', 1, 'tsp')])),
    );
    expect(merged.items).toEqual([expect.objectContaining({ amountText: '1 tsp', meals: ['Meal b', 'Meal a'] })]);

    const alone = buildShoppingList([{ slug: 'a', servings: 1 }], map(recipe('a', 1, [ing('salt', 1, 'pinch')])));
    expect(alone.items).toEqual([expect.objectContaining({ quantity: null, unit: null, amountText: 'to taste' })]);
  });

  it('marks an ingredient optional only when every use is optional', () => {
    const list = buildShoppingList(
      [
        { slug: 'a', servings: 1 },
        { slug: 'b', servings: 1 },
      ],
      map(
        recipe('a', 1, [ing('shito', 1, 'tbsp', { optional: true }), ing('egg', 1, 'piece', { optional: true })]),
        recipe('b', 1, [ing('egg', 2, 'piece')]),
      ),
    );
    const byName = Object.fromEntries(list.items.map((i) => [i.name, i]));
    expect(byName.shito!.optional).toBe(true);
    expect(byName.egg).toMatchObject({ optional: false, amountText: '3' });
  });

  it('rounds counted items up (half an onion is still one onion)', () => {
    const list = buildShoppingList([{ slug: 'a', servings: 1 }], map(recipe('a', 4, [ing('onion', 2, 'piece')])));
    expect(list.items[0]).toMatchObject({ quantity: 0.5, amountText: '1' });
  });

  it('reports meals that no longer exist instead of failing', () => {
    const list = buildShoppingList([{ slug: 'gone', servings: 1 }], map());
    expect(list).toEqual({ items: [], skipped: ['gone'] });
  });

  it('works for every seed meal: no empty amounts, grouped in aisle order', () => {
    const recipes = seedRecipes();
    const entries = [...recipes.keys()].map((slug) => ({ slug, servings: 2 }));
    const list = buildShoppingList(entries, recipes);
    expect(list.skipped).toEqual([]);
    expect(list.items.length).toBeGreaterThan(20);
    for (const item of list.items) {
      expect(item.amountText).not.toBe('');
      expect(item.meals.length).toBeGreaterThan(0);
    }
    const categories = list.items.map((i) => i.category);
    expect([...categories].sort(compareCategories)).toEqual(categories);
    // One line per ingredient and unit family: no duplicate keys.
    expect(new Set(list.items.map((i) => i.key)).size).toBe(list.items.length);
  });
});
