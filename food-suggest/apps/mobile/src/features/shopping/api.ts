import type { GeneratedShoppingList, ShoppingListRequest } from '@food-suggest/shared';

import { apiPost } from '@/lib/api';
import type { PlanEntry } from '@/stores/meal-plan';

/** Planned meals → request entries. The API adds everything up, so entries are sent as they are. */
export function toShoppingRequest(entries: PlanEntry[]): ShoppingListRequest {
  return { entries: entries.map((e) => ({ slug: e.slug, servings: e.servings })) };
}

export function generateShoppingList(entries: PlanEntry[]): Promise<GeneratedShoppingList> {
  return apiPost<GeneratedShoppingList>('/shopping-list', toShoppingRequest(entries));
}
