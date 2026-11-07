import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ProfileInput } from '@food-suggest/shared';

import { deviceStorage } from './persist-storage';

/** Everything the user chose in onboarding, minus app display preferences. */
export type ProfileDraft = Partial<Omit<ProfileInput, 'showCalories'>>;

interface ProfileState {
  profile: ProfileDraft;
  onboardingComplete: boolean;
  update: (changes: ProfileDraft) => void;
  completeOnboarding: () => void;
  /** Removes everything this store saved on the device. */
  reset: () => void;
}

/**
 * The personalisation profile. For anonymous users it lives ONLY on this device
 * and is sent with each recommendation request; it is never stored on the server.
 */
export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: {},
      onboardingComplete: false,
      update: (changes) => set((s) => ({ profile: { ...s.profile, ...changes } })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      reset: () => set({ profile: {}, onboardingComplete: false }),
    }),
    { name: 'fs.profile', storage: deviceStorage, version: 1 },
  ),
);

/** Builds the API profile, or null if the required age gate hasn't been passed. */
export function toProfileInput(draft: ProfileDraft, showCalories: boolean): ProfileInput | null {
  if (!draft.birthYear) return null;
  return {
    allergens: [],
    avoidIngredients: [],
    likedIngredients: [],
    dislikedIngredients: [],
    cuisines: [],
    preferredSlots: [],
    ...draft,
    birthYear: draft.birthYear,
    showCalories,
  };
}
