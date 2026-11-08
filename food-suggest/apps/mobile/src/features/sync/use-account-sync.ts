import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useIsSignedIn } from '@/stores/auth';
import { useMealPlan } from '@/stores/meal-plan';
import { useShoppingLists } from '@/stores/shopping-lists';

import { isApplyingRemote, syncNow } from './engine';

const DEBOUNCE_MS = 2000;

/**
 * While signed in, keeps the meal plan and shopping lists in step with the account:
 * on sign-in (this also moves anything planned before signing in into the account),
 * when the app comes back to the foreground or back online, and shortly after each local change.
 */
export function useAccountSync() {
  const signedIn = useIsSignedIn();

  useEffect(() => {
    if (!signedIn) return;
    void syncNow();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (isApplyingRemote()) return;
      clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), DEBOUNCE_MS);
    };
    const stopPlan = useMealPlan.subscribe(schedule);
    const stopLists = useShoppingLists.subscribe(schedule);
    const stopOnline = onlineManager.subscribe((online) => {
      if (online) void syncNow();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });

    return () => {
      clearTimeout(timer);
      stopPlan();
      stopLists();
      stopOnline();
      appState.remove();
    };
  }, [signedIn]);
}
