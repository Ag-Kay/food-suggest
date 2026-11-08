import { compareCategories } from '@food-suggest/shared';

import { MANUAL_CATEGORY, type ShoppingItem } from '@/stores/shopping-lists';

export interface ItemSection {
  category: string;
  items: ShoppingItem[];
}

/** Groups items by aisle (shop order), with the user's own items last. Order within a group is kept. */
export function groupByCategory(items: ShoppingItem[]): ItemSection[] {
  const map = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === MANUAL_CATEGORY ? 1 : b === MANUAL_CATEGORY ? -1 : compareCategories(a, b)))
    .map(([category, list]) => ({ category, items: list }));
}
