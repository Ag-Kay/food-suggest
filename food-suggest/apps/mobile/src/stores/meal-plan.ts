import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MAX_PLAN_SERVINGS, type MealSlot } from '@food-suggest/shared';

import { addDays, todayKey, type DateKey } from '@/features/plan/dates';
import { localId } from '@/lib/local-id';

import { deviceStorage } from './persist-storage';

export interface PlanEntry {
  id: string;
  date: DateKey;
  slot: MealSlot;
  slug: string;
  /** Kept so the plan reads well offline; the meal details come from the API. */
  name: string;
  /** Portions to cook. */
  servings: number;
  /** Last local change (ms), used to pick the newest version when syncing. */
  changedAt: number;
}

export type NewPlanEntry = Omit<PlanEntry, 'id' | 'changedAt'>;

/** Deleted record ids → when they were deleted, kept until the account has them. */
export type Tombstones = Record<string, number>;

/** Past days are kept this long, then dropped (the plan is a working tool, not a diary). */
export const KEEP_PAST_DAYS = 14;

/** A change time strictly newer than the record's last one (clocks can tie within a millisecond). */
export const nextChange = (previous = 0) => Math.max(Date.now(), previous + 1);

export const clampServings = (n: number) => Math.min(MAX_PLAN_SERVINGS, Math.max(1, Math.round(n)));

interface MealPlanState {
  entries: PlanEntry[];
  /** Servings used last time, offered as the default next time. */
  lastServings: number;
  /** Deletions not yet confirmed by the account (signed-in sync only). */
  tombstones: Tombstones;
  add: (entry: NewPlanEntry) => PlanEntry;
  replace: (id: string, meal: { slug: string; name: string }) => void;
  setServings: (id: string, servings: number) => void;
  remove: (id: string) => void;
  /** Drops entries older than KEEP_PAST_DAYS (not a deletion: nothing is synced). */
  prune: (today?: DateKey) => void;
  /** Empties the plan on this phone only (no tombstones: the account keeps its copy). */
  clear: () => void;
}

/** The meal plan. Stored on this device only (account sync arrives in M5b). */
export const useMealPlan = create<MealPlanState>()(
  persist(
    (set) => ({
      entries: [],
      lastServings: 1,
      tombstones: {},
      add: (input) => {
        const entry: PlanEntry = { ...input, servings: clampServings(input.servings), id: localId(), changedAt: Date.now() };
        set((s) => ({ entries: [...s.entries, entry], lastServings: entry.servings }));
        return entry;
      },
      replace: (id, meal) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, slug: meal.slug, name: meal.name, changedAt: nextChange(e.changedAt) } : e)),
        })),
      setServings: (id, servings) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, servings: clampServings(servings), changedAt: nextChange(e.changedAt) } : e)),
        })),
      remove: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
          tombstones: { ...s.tombstones, [id]: nextChange(s.entries.find((e) => e.id === id)?.changedAt) },
        })),
      prune: (today = todayKey()) => {
        const cutoff = addDays(today, -KEEP_PAST_DAYS);
        set((s) => ({ entries: s.entries.filter((e) => e.date >= cutoff) }));
      },
      clear: () => set({ entries: [], lastServings: 1, tombstones: {} }),
    }),
    {
      name: 'fs.meal-plan',
      storage: deviceStorage,
      version: 2,
      partialize: (s) => ({ entries: s.entries, lastServings: s.lastServings, tombstones: s.tombstones }),
      // v1 (M5) entries had no change time: treat them as changed now so they upload on first sync.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as { entries?: Omit<PlanEntry, 'changedAt'>[]; lastServings?: number };
        if (version < 2) {
          const now = Date.now();
          return { ...state, entries: (state.entries ?? []).map((e) => ({ ...e, changedAt: now })), tombstones: {} };
        }
        return persisted as Partial<MealPlanState>;
      },
      onRehydrateStorage: () => (state) => state?.prune(),
    },
  ),
);

const SLOT_ORDER: MealSlot[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

/** Entries between two days (inclusive), sorted by day then slot. */
export function entriesBetween(entries: PlanEntry[], start: DateKey, end: DateKey): PlanEntry[] {
  return entries
    .filter((e) => e.date >= start && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
}
