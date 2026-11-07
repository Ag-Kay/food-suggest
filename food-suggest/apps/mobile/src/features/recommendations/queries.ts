import { useQuery } from '@tanstack/react-query';

import type { MealSlot, RecommendationResponse } from '@food-suggest/shared';

import { apiGet, apiPost } from '@/lib/api';
import { usePreferences } from '@/stores/preferences';
import { toProfileInput, useProfile } from '@/stores/profile';

export function useRecommendations({ slot, limit = 5 }: { slot?: MealSlot; limit?: number } = {}) {
  const draft = useProfile((s) => s.profile);
  const complete = useProfile((s) => s.onboardingComplete);
  const showCalories = usePreferences((s) => s.showCalories);
  const profile = toProfileInput(draft, showCalories);

  return useQuery({
    // The profile is part of the key so any change refetches. It stays in memory only.
    queryKey: ['recommendations', profile, slot, limit],
    queryFn: ({ signal }) =>
      apiPost<RecommendationResponse>('/recommendations', { profile, slot, limit }, { signal }),
    enabled: complete && profile !== null,
    staleTime: 60_000,
  });
}

export interface IngredientOption {
  slug: string;
  name: string;
  aliases: string[];
  shoppingCategory: string;
}

export function useIngredients() {
  return useQuery({
    queryKey: ['catalogue', 'ingredients'],
    queryFn: ({ signal }) => apiGet<{ items: IngredientOption[] }>('/ingredients', { signal }),
    staleTime: 60 * 60_000,
  });
}
