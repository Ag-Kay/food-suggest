import {
  BASE_UNIT,
  compareCategories,
  formatAmount,
  normaliseAmount,
  type GeneratedShoppingItem,
  type GeneratedShoppingList,
  type ShoppingListRequest,
  type UnitFamily,
} from '@food-suggest/shared';

/** A meal's default recipe, as much as the shopping list needs. */
export interface RecipeForShopping {
  slug: string;
  name: string;
  /** Portions the recipe quantities make. */
  servings: number;
  ingredients: {
    slug: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    optional: boolean;
  }[];
}

type Bucket =
  | { kind: 'measured'; family: UnitFamily; base: number }
  | { kind: 'other'; unit: string; quantity: number }
  | { kind: 'unquantified' };

interface Line {
  key: string;
  slug: string;
  name: string;
  category: string;
  bucket: Bucket;
  /** Stays true only while every use is optional. */
  optional: boolean;
  meals: string[];
}

const trimNumber = (n: number) => String(Number(n.toFixed(2)));

/**
 * Turns planned meals into one shopping list.
 *
 * - Quantities are scaled from the recipe's servings to the planned servings.
 * - The same ingredient is added up only within one unit family (mass, volume, count) or,
 *   for units we don't know, the identical unit. Different families stay separate lines;
 *   we never guess a conversion such as tablespoons → grams.
 * - "To taste" amounts are folded into a measured line for the same ingredient when one exists.
 * - Amounts are rounded up for display (see `formatAmount`).
 */
export function buildShoppingList(
  entries: ShoppingListRequest['entries'],
  recipes: Map<string, RecipeForShopping>,
): GeneratedShoppingList {
  const lines = new Map<string, Line>();
  const skipped = new Set<string>();

  for (const entry of entries) {
    const recipe = recipes.get(entry.slug);
    if (!recipe || recipe.servings <= 0) {
      skipped.add(entry.slug);
      continue;
    }
    const factor = entry.servings / recipe.servings;

    for (const ing of recipe.ingredients) {
      const amount = normaliseAmount(ing.quantity * factor, ing.unit);
      const suffix =
        amount.kind === 'measured' ? amount.family : amount.kind === 'other' ? `unit:${amount.unit}` : 'to-taste';
      const key = `${ing.slug}:${suffix}`;

      let line = lines.get(key);
      if (!line) {
        line = {
          key,
          slug: ing.slug,
          name: ing.name,
          category: ing.category,
          bucket:
            amount.kind === 'measured'
              ? { kind: 'measured', family: amount.family, base: 0 }
              : amount.kind === 'other'
                ? { kind: 'other', unit: amount.unit, quantity: 0 }
                : { kind: 'unquantified' },
          optional: true,
          meals: [],
        };
        lines.set(key, line);
      }
      if (line.bucket.kind === 'measured' && amount.kind === 'measured') line.bucket.base += amount.base;
      if (line.bucket.kind === 'other' && amount.kind === 'other') line.bucket.quantity += amount.quantity;
      line.optional &&= ing.optional;
      if (!line.meals.includes(recipe.name)) line.meals.push(recipe.name);
    }
  }

  // A "to taste" line is redundant when the same ingredient is also bought by amount.
  for (const line of [...lines.values()]) {
    if (line.bucket.kind !== 'unquantified') continue;
    const measured = [...lines.values()].find((l) => l.slug === line.slug && l.bucket.kind !== 'unquantified');
    if (!measured) continue;
    for (const meal of line.meals) if (!measured.meals.includes(meal)) measured.meals.push(meal);
    measured.optional &&= line.optional;
    lines.delete(line.key);
  }

  const items: GeneratedShoppingItem[] = [...lines.values()].map((line) => {
    const b = line.bucket;
    const base = { key: line.key, ingredientSlug: line.slug, name: line.name, category: line.category, optional: line.optional, meals: line.meals };
    if (b.kind === 'measured') {
      return { ...base, quantity: Number(b.base.toFixed(2)), unit: BASE_UNIT[b.family], amountText: formatAmount(b.family, b.base) };
    }
    if (b.kind === 'other') {
      return { ...base, quantity: Number(b.quantity.toFixed(2)), unit: b.unit, amountText: `${trimNumber(b.quantity)} ${b.unit}` };
    }
    return { ...base, quantity: null, unit: null, amountText: 'to taste' };
  });

  items.sort((a, b) => compareCategories(a.category, b.category) || a.name.localeCompare(b.name));
  return { items, skipped: [...skipped] };
}
