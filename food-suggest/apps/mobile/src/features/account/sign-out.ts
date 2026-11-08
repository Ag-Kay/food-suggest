import type { QueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { usePreferences } from '@/stores/preferences';
import { useMealPlan } from '@/stores/meal-plan';
import { useProfile } from '@/stores/profile';
import { useRecentMeals } from '@/stores/recent-meals';
import { useShoppingLists } from '@/stores/shopping-lists';

/** Removes personal data kept on this phone (useful on shared devices). */
export function clearLocalData(queryClient: QueryClient) {
  useProfile.getState().reset();
  useRecentMeals.getState().clear();
  useMealPlan.getState().clear();
  useShoppingLists.getState().clear();
  usePreferences.getState().setShowCalories(false);
  queryClient.removeQueries({ queryKey: ['me'] });
  queryClient.removeQueries({ queryKey: ['recommendations'] });
}

export async function signOut(queryClient: QueryClient) {
  await supabase?.auth.signOut();
  clearLocalData(queryClient);
}
