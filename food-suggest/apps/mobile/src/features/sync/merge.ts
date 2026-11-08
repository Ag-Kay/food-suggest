import type { PlanEntrySync, ShoppingListSync, SyncRequest } from '@food-suggest/shared';

import type { PlanEntry, Tombstones } from '@/stores/meal-plan';
import type { ShoppingList } from '@/stores/shopping-lists';

/** A record from the account; `record` is null when it was deleted. */
export interface Remote<T> {
  id: string;
  changedAt: number;
  record: T | null;
}

export interface LocalMerge<T> {
  records: T[];
  tombstones: Tombstones;
}

/**
 * Merges the account's records into this phone's, per id, newest change winning
 * (the account wins ties). Local edits made while the request was in flight are newer,
 * so they survive and upload on the next sync. A local tombstone is dropped once the
 * account has the deletion (or a newer version).
 */
export function mergeLocal<T extends { id: string }>(
  local: T[],
  tombstones: Tombstones,
  remote: Remote<T>[],
  changedAt: (record: T) => number,
): LocalMerge<T> {
  const byId = new Map(local.map((r) => [r.id, r]));
  const tombs = { ...tombstones };

  for (const r of remote) {
    const mine = byId.get(r.id);
    const myTomb = tombs[r.id];
    const mineAt = Math.max(mine ? changedAt(mine) : -Infinity, myTomb ?? -Infinity);

    if (r.changedAt >= mineAt) {
      // The account's version wins (or is the same one we sent).
      if (myTomb !== undefined) delete tombs[r.id];
      if (r.record) byId.set(r.id, r.record);
      else byId.delete(r.id);
    }
  }
  return { records: [...byId.values()], tombstones: tombs };
}

// ─────────────── Mapping between on-device records and the sync format ───────────────

export function planToSync(entries: PlanEntry[], tombstones: Tombstones): PlanEntrySync[] {
  return [
    ...entries.map((e) => ({
      id: e.id,
      changedAt: e.changedAt,
      deleted: false as const,
      date: e.date,
      slot: e.slot,
      slug: e.slug,
      name: e.name,
      servings: e.servings,
    })),
    ...Object.entries(tombstones).map(([id, changedAt]) => ({ id, changedAt, deleted: true as const })),
  ];
}

export function planFromSync(r: PlanEntrySync): Remote<PlanEntry> {
  if (r.deleted) return { id: r.id, changedAt: r.changedAt, record: null };
  const { deleted: _deleted, ...entry } = r;
  return { id: r.id, changedAt: r.changedAt, record: entry };
}

export function listsToSync(lists: ShoppingList[], tombstones: Tombstones): ShoppingListSync[] {
  return [
    ...lists.map((l) => ({
      id: l.id,
      changedAt: l.updatedAt,
      deleted: false as const,
      name: l.name,
      createdAt: l.createdAt,
      ...(l.fromPlan && { fromPlan: l.fromPlan }),
      items: l.items,
    })),
    ...Object.entries(tombstones).map(([id, changedAt]) => ({ id, changedAt, deleted: true as const })),
  ];
}

export function listFromSync(r: ShoppingListSync): Remote<ShoppingList> {
  if (r.deleted) return { id: r.id, changedAt: r.changedAt, record: null };
  const list: ShoppingList = { id: r.id, name: r.name, createdAt: r.createdAt, updatedAt: r.changedAt, items: r.items };
  if (r.fromPlan) list.fromPlan = r.fromPlan;
  return { id: r.id, changedAt: r.changedAt, record: list };
}

export function buildSyncRequest(
  plan: { entries: PlanEntry[]; tombstones: Tombstones },
  lists: { lists: ShoppingList[]; tombstones: Tombstones },
): SyncRequest {
  return { planEntries: planToSync(plan.entries, plan.tombstones), shoppingLists: listsToSync(lists.lists, lists.tombstones) };
}
