import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { deviceStorage } from './persist-storage';

export interface RecentMeal {
  slug: string;
  name: string;
  cuisine: string;
  viewedAt: number;
}

const MAX_RECENT = 10;

interface RecentMealsState {
  items: RecentMeal[];
  add: (meal: Omit<RecentMeal, 'viewedAt'>) => void;
  clear: () => void;
}

/** Recently viewed meals, newest first. Stored on this device only. */
export const useRecentMeals = create<RecentMealsState>()(
  persist(
    (set) => ({
      items: [],
      add: (meal) =>
        set((s) => ({
          items: [{ ...meal, viewedAt: Date.now() }, ...s.items.filter((m) => m.slug !== meal.slug)].slice(
            0,
            MAX_RECENT,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'fs.recent-meals', storage: deviceStorage, version: 1 },
  ),
);
