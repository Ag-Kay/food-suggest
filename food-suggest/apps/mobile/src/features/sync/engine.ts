import { create } from 'zustand';

import type { SyncResponse } from '@food-suggest/shared';

import { addDays, todayKey } from '@/features/plan/dates';
import { apiPost, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { KEEP_PAST_DAYS, useMealPlan } from '@/stores/meal-plan';
import { useShoppingLists } from '@/stores/shopping-lists';

import { buildSyncRequest, listFromSync, mergeLocal, planFromSync } from './merge';

interface SyncStatus {
  lastSyncedAt: number | null;
  /** User-presentable message for the last failure, cleared on success. */
  error: string | null;
}

/** In memory only: shown on the Profile screen. */
export const useSyncStatus = create<SyncStatus>(() => ({ lastSyncedAt: null, error: null }));

let running: Promise<void> | null = null;
let again = false;
let applying = false;

/** True while the account's data is being written into the stores (not a local change). */
export const isApplyingRemote = () => applying;

/**
 * Syncs the meal plan and shopping lists with the account. Safe to call often: only one
 * sync runs at a time, and a call during a sync schedules one more afterwards.
 */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await syncOnce();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function syncOnce(): Promise<void> {
  const userId = useAuth.getState().session?.user.id;
  if (!userId) return;

  let response: SyncResponse;
  try {
    response = await apiPost<SyncResponse>(
      '/me/sync',
      buildSyncRequest(useMealPlan.getState(), useShoppingLists.getState()),
      { auth: true, timeoutMs: 20_000 },
    );
  } catch (err) {
    const message =
      err instanceof ApiRequestError && err.code === 'SYNC_LIMIT'
        ? err.message
        : "Couldn't sync your plan and lists. We'll try again.";
    useSyncStatus.setState({ error: message });
    if (__DEV__) console.warn('[sync] failed', err);
    return;
  }

  // Signed out (or switched account) while the request was in flight: don't apply.
  if (useAuth.getState().session?.user.id !== userId) return;

  applying = true;
  try {
    const cutoff = addDays(todayKey(), -KEEP_PAST_DAYS);
    const plan = useMealPlan.getState();
    const mergedPlan = mergeLocal(
      plan.entries,
      plan.tombstones,
      response.planEntries.map(planFromSync).filter((r) => !r.record || r.record.date >= cutoff),
      (e) => e.changedAt,
    );
    useMealPlan.setState({ entries: mergedPlan.records, tombstones: mergedPlan.tombstones });

    const lists = useShoppingLists.getState();
    const mergedLists = mergeLocal(lists.lists, lists.tombstones, response.shoppingLists.map(listFromSync), (l) => l.updatedAt);
    useShoppingLists.setState({
      lists: mergedLists.records.sort((a, b) => b.createdAt - a.createdAt),
      tombstones: mergedLists.tombstones,
    });
  } finally {
    applying = false;
  }
  useSyncStatus.setState({ lastSyncedAt: Date.now(), error: null });
}
