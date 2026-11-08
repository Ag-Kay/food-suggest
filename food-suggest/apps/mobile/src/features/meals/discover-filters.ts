import { create } from 'zustand';

import type { DietType, MealSlot } from '@food-suggest/shared';

export interface DiscoverFilters {
  slot?: MealSlot;
  diet?: DietType;
  cuisine?: string;
  maxMinutes?: number;
}

interface DiscoverFiltersState extends DiscoverFilters {
  set: (patch: Partial<DiscoverFilters>) => void;
  /** Clears the sheet filters (diet, time, cuisine); keeps the meal-type chips. */
  resetSheet: () => void;
  resetAll: () => void;
}

/** Discover filters, shared between the Discover tab and its filter sheet. In memory only. */
export const useDiscoverFilters = create<DiscoverFiltersState>((set) => ({
  set: (patch) => set(patch),
  resetSheet: () => set({ diet: undefined, cuisine: undefined, maxMinutes: undefined }),
  resetAll: () => set({ slot: undefined, diet: undefined, cuisine: undefined, maxMinutes: undefined }),
}));

/** Number of filters set in the sheet (shown on the filter button). */
export const sheetFilterCount = (f: DiscoverFilters) => [f.diet, f.cuisine, f.maxMinutes].filter((v) => v !== undefined).length;
