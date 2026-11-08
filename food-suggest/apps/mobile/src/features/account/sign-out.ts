import type { QueryClient } from '@tanstack/react-query';

import { syncNow, useSyncStatus } from '@/features/sync/engine';
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
  useSyncStatus.setState({ lastSyncedAt: null, error: null });
  queryClient.removeQueries({ queryKey: ['me'] });
  queryClient.removeQueries({ queryKey: ['recommendations'] });
}

export async function signOut(queryClient: QueryClient) {
  // Upload the latest plan and list changes first; if that fails they stay only on this phone
  // until it's cleared below, so the account keeps its last synced copy.
  await syncNow().catch(() => {});
  await supabase?.auth.signOut();
  clearLocalData(queryClient);
}
