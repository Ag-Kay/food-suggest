import { z } from 'zod';

// ───────────────────────────── Units ─────────────────────────────
//
// Recipes use cooks' units ("2 tsp", "1 piece", "400 g"). A shopping list may only add
// quantities that measure the same thing: grams with kilograms, spoons with cups, pieces with
// pieces. We never convert between families (e.g. volume → weight), because that needs a
// density per ingredient and would quietly produce wrong amounts.

export type UnitFamily = 'mass' | 'volume' | 'count';

/** Base unit per family: grams, millilitres, pieces. */
export const BASE_UNIT: Record<UnitFamily, 'g' | 'ml' | 'piece'> = { mass: 'g', volume: 'ml', count: 'piece' };

const UNITS: Record<string, { family: UnitFamily; toBase: number }> = {
  g: { family: 'mass', toBase: 1 },
  kg: { family: 'mass', toBase: 1000 },
  ml: { family: 'volume', toBase: 1 },
  l: { family: 'volume', toBase: 1000 },
  tsp: { family: 'volume', toBase: 5 },
  tbsp: { family: 'volume', toBase: 15 },
  cup: { family: 'volume', toBase: 240 },
  piece: { family: 'count', toBase: 1 },
};

/** Units that carry no amount worth adding up. */
const UNQUANTIFIED = new Set(['pinch', 'to taste']);

export type NormalisedAmount =
  | { kind: 'measured'; family: UnitFamily; base: number }
  | { kind: 'unquantified' }
  /** A unit we don't know: only identical units may be added together. */
  | { kind: 'other'; unit: string; quantity: number };

export function normaliseAmount(quantity: number, unit: string): NormalisedAmount {
  const u = unit.trim().toLowerCase();
  if (UNQUANTIFIED.has(u)) return { kind: 'unquantified' };
  const known = UNITS[u];
  if (known) return { kind: 'measured', family: known.family, base: quantity * known.toBase };
  return { kind: 'other', unit: u, quantity };
}

const ceilTo = (value: number, step: number) => Math.ceil(value / step - 1e-9) * step;
const trim = (n: number) => String(Number(n.toFixed(2)));

/**
 * Turns a summed base amount into something a person would buy, always rounding UP so
 * nobody comes home short: 437 g → "440 g", 1240 g → "1.3 kg", 20 ml → "1.5 tbsp", 1.5 pieces → "2".
 */
export function formatAmount(family: UnitFamily, base: number): string {
  if (!(base > 0)) return '';
  switch (family) {
    case 'mass':
      if (base >= 1000) return `${trim(ceilTo(base / 1000, 0.1))} kg`;
      return `${trim(ceilTo(base, base >= 50 ? 10 : 5))} g`;
    case 'volume':
      if (base < 15) return `${trim(ceilTo(base / 5, 0.5))} tsp`;
      // Spoons up to 8 tbsp (half a cup) read better than "0.25 cup".
      if (base < 120) return `${trim(ceilTo(base / 15, 0.5))} tbsp`;
      if (base < 1000) return `${trim(ceilTo(base / 240, 0.25))} cup${base > 240 ? 's' : ''}`;
      return `${trim(ceilTo(base / 1000, 0.1))} l`;
    case 'count':
      return String(Math.ceil(base - 1e-9));
  }
}

// ───────────────────────────── API ─────────────────────────────

export const MAX_PLAN_SERVINGS = 12;

export const ShoppingListRequest = z
  .object({
    /** One entry per planned meal. Servings = portions to cook for that meal. */
    entries: z
      .array(
        z
          .object({
            slug: z.string().min(1).max(100),
            servings: z.number().positive().max(MAX_PLAN_SERVINGS),
          })
          .strict(),
      )
      .min(1)
      .max(120),
  })
  .strict();
export type ShoppingListRequest = z.infer<typeof ShoppingListRequest>;

export interface GeneratedShoppingItem {
  /** Stable within one list: ingredient slug plus unit family. */
  key: string;
  ingredientSlug: string;
  name: string;
  category: string;
  /** Summed amount in the base unit (g, ml, piece), or the unknown unit's own amount. Null = "to taste". */
  quantity: number | null;
  unit: string | null;
  /** Ready to show, e.g. "1.3 kg", "2 tbsp", "3", "to taste". */
  amountText: string;
  /** True when every recipe that uses it marks it optional (e.g. shito on waakye). */
  optional: boolean;
  /** Meal names that need this ingredient. */
  meals: string[];
}

export interface GeneratedShoppingList {
  items: GeneratedShoppingItem[];
  /** Slugs that were skipped because the meal no longer exists. */
  skipped: string[];
}

/** Aisle order for grouping; unknown categories go last, alphabetically. */
export const SHOPPING_CATEGORY_ORDER = [
  'Vegetables',
  'Fruit',
  'Tubers & plantain',
  'Meat & poultry',
  'Fish & seafood',
  'Dairy & eggs',
  'Grains & flours',
  'Beans, nuts & seeds',
  'Canned & jarred',
  'Oils',
  'Spices & seasonings',
  'Other',
] as const;

export function compareCategories(a: string, b: string): number {
  const order = SHOPPING_CATEGORY_ORDER as readonly string[];
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  return a.localeCompare(b);
}
