import { useEffect, useRef } from 'react';

import { useIsSignedIn } from '@/stores/auth';
import { usePreferences } from '@/stores/preferences';
import { toProfileInput, useProfile } from '@/stores/profile';

import { saveProfile, useMe } from './api';

const DEBOUNCE_MS = 1500;

/**
 * Keeps the account's profile in step with the phone. Uploads only when the user
 * is signed in AND has consented to storing health-related data.
 */
export function useProfileSync() {
  const signedIn = useIsSignedIn();
  const me = useMe();
  const canSync = signedIn && !!me.data?.consents.healthData.granted;
  const profile = useProfile((s) => s.profile);
  const complete = useProfile((s) => s.onboardingComplete);
  const showCalories = usePreferences((s) => s.showCalories);
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!canSync || !complete) return;
    const input = toProfileInput(profile, showCalories);
    if (!input) return;
    const serialised = JSON.stringify(input);
    if (serialised === lastSent.current) return;
    const timer = setTimeout(() => {
      saveProfile(input)
        .then(() => {
          lastSent.current = serialised;
        })
        .catch(() => {
          // Offline or server error: the next change (or app start) retries.
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [canSync, complete, profile, showCalories]);
}
