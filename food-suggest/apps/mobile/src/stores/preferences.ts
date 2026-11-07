import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { deviceStorage } from './persist-storage';

interface PreferencesState {
  /** Calories are hidden by default; the app leads with food quality. */
  showCalories: boolean;
  setShowCalories: (value: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      showCalories: false,
      setShowCalories: (showCalories) => set({ showCalories }),
    }),
    { name: 'fs.preferences', storage: deviceStorage, version: 1 },
  ),
);
