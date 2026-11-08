import { incomingWins, SYNC_LIMITS, type PlanEntrySync, type ShoppingListSync, type SyncRequest } from '@food-suggest/shared';

import { HttpError } from '../../lib/http-error.js';

/** A device clock this far ahead is treated as "now", so a wrong clock can't win forever. */
export const MAX_CLOCK_SKEW_MS = 5 * 60_000;
/** Tombstones are kept this long so other devices learn about deletions. */
export const TOMBSTONE_TTL_MS = 60 * 86_400_000;
/** Plan days older than this are dropped (the app keeps 14 days; this leaves room for time zones). */
export const PLAN_RETENTION_DAYS = 30;

type Syncable = { id: string; changedAt: number; deleted: boolean };

export interface MergeResult<T extends Syncable> {
  /** The account's records after the merge (before purging). */
  final: Map<string, T>;
  /** Records that must be written (they won against what was stored). */
  changed: T[];
}

/** Applies incoming records over stored ones, newest change winning per id. */
export function mergeRecords<T extends Syncable>(stored: T[], incoming: T[], nowMs: number): MergeResult<T> {
  const final = new Map(stored.map((r) => [r.id, r]));
  const changed = new Map<string, T>();
  for (const raw of incoming) {
    const record = { ...raw, changedAt: Math.min(raw.changedAt, nowMs + MAX_CLOCK_SKEW_MS) };
    if (incomingWins(final.get(record.id), record)) {
      final.set(record.id, record);
      changed.set(record.id, record);
    }
  }
  return { final, changed: [...changed.values()] };
}

const dateKeyDaysAgo = (nowMs: number, days: number) => new Date(nowMs - days * 86_400_000).toISOString().slice(0, 10);

/** Ids to remove for good: old tombstones and plan entries for long-past days. */
export function purgeable(records: (PlanEntrySync | ShoppingListSync)[], nowMs: number): string[] {
  const planCutoff = dateKeyDaysAgo(nowMs, PLAN_RETENTION_DAYS);
  return records
    .filter((r) =>
      r.deleted ? r.changedAt < nowMs - TOMBSTONE_TTL_MS : 'date' in r && (r as { date: string }).date < planCutoff,
    )
    .map((r) => r.id);
}

export interface SyncPlan {
  planEntries: MergeResult<PlanEntrySync> & { purge: string[] };
  shoppingLists: MergeResult<ShoppingListSync> & { purge: string[] };
}

/** Everything a repository needs to write, plus the state to return. Throws if the account would exceed its caps. */
export function planSync(
  stored: { planEntries: PlanEntrySync[]; shoppingLists: ShoppingListSync[] },
  request: SyncRequest,
  nowMs: number,
): SyncPlan {
  const plan = mergeRecords(stored.planEntries, request.planEntries, nowMs);
  const lists = mergeRecords(stored.shoppingLists, request.shoppingLists, nowMs);

  const live = (m: Map<string, Syncable>) => [...m.values()].filter((r) => !r.deleted).length;
  if (live(plan.final) > SYNC_LIMITS.planEntries || live(lists.final) > SYNC_LIMITS.shoppingLists) {
    throw new HttpError(422, 'SYNC_LIMIT', 'Your meal plan or shopping lists are too large to sync. Remove some items and try again.');
  }

  return {
    planEntries: { ...plan, purge: purgeable([...plan.final.values()], nowMs) },
    shoppingLists: { ...lists, purge: purgeable([...lists.final.values()], nowMs) },
  };
}

/** The response body: the merged state without purged records. */
export function finalState(plan: SyncPlan) {
  const keep = <T extends Syncable>(m: Map<string, T>, purge: string[]) => {
    const drop = new Set(purge);
    return [...m.values()].filter((r) => !drop.has(r.id));
  };
  return {
    planEntries: keep(plan.planEntries.final, plan.planEntries.purge),
    shoppingLists: keep(plan.shoppingLists.final, plan.shoppingLists.purge),
  };
}
