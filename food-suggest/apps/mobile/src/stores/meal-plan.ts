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
}

export type NewPlanEntry = Omit<PlanEntry, 'id'>;

/** Past days are kept this long, then dropped (the plan is a working tool, not a diary). */
export const KEEP_PAST_DAYS = 14;

export const clampServings = (n: number) => Math.min(MAX_PLAN_SERVINGS, Math.max(1, Math.round(n)));

interface MealPlanState {
  entries: PlanEntry[];
  /** Servings used last time, offered as the default next time. */
  lastServings: number;
  add: (entry: NewPlanEntry) => PlanEntry;
  replace: (id: string, meal: { slug: string; name: string }) => void;
  setServings: (id: string, servings: number) => void;
  remove: (id: string) => void;
  /** Drops entries older than KEEP_PAST_DAYS. */
  prune: (today?: DateKey) => void;
  clear: () => void;
}

/** The meal plan. Stored on this device only (account sync arrives in M5b). */
export const useMealPlan = create<MealPlanState>()(
  persist(
    (set) => ({
      entries: [],
      lastServings: 1,
      add: (input) => {
        const entry: PlanEntry = { ...input, servings: clampServings(input.servings), id: localId() };
        set((s) => ({ entries: [...s.entries, entry], lastServings: entry.servings }));
        return entry;
      },
      replace: (id, meal) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, slug: meal.slug, name: meal.name } : e)) })),
      setServings: (id, servings) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, servings: clampServings(servings) } : e)) })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      prune: (today = todayKey()) => {
        const cutoff = addDays(today, -KEEP_PAST_DAYS);
        set((s) => ({ entries: s.entries.filter((e) => e.date >= cutoff) }));
      },
      clear: () => set({ entries: [], lastServings: 1 }),
    }),
    {
      name: 'fs.meal-plan',
      storage: deviceStorage,
      version: 1,
      partialize: (s) => ({ entries: s.entries, lastServings: s.lastServings }),
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
