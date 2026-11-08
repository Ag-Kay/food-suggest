import type { PlanEntrySync, ShoppingListSync } from '@food-suggest/shared';

import { finalState, planSync } from './merge.js';
import type { SyncRepository } from './sync.repository.js';

/** In-memory SyncRepository using the same merge rules as the database version. */
export function createFakeSyncRepository(): SyncRepository & {
  state: Map<string, { planEntries: PlanEntrySync[]; shoppingLists: ShoppingListSync[] }>;
} {
  const state = new Map<string, { planEntries: PlanEntrySync[]; shoppingLists: ShoppingListSync[] }>();
  return {
    state,
    async sync(userId, request, now = new Date()) {
      const stored = state.get(userId) ?? { planEntries: [], shoppingLists: [] };
      const result = finalState(planSync(stored, request, now.getTime()));
      state.set(userId, result);
      return { ...result, serverTime: now.getTime() };
    },
  };
}
