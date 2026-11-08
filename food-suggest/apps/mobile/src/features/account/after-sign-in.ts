import type { ProfileInput } from '@food-suggest/shared';

import { usePreferences } from '@/stores/preferences';
import { toProfileInput, useProfile } from '@/stores/profile';

import { claimProfile, fetchMe } from './api';

/** Copies a server profile into the on-device store. */
export function applyServerProfile(profile: ProfileInput) {
  const { showCalories, ...rest } = profile;
  useProfile.setState({ profile: rest, onboardingComplete: true });
  usePreferences.getState().setShowCalories(showCalories);
}

export type AfterSignIn = { next: 'consent' } | { next: 'done'; message: string | null };

/**
 * Runs after a successful sign-in (and again after consent):
 * - no consent yet → ask for it (we never upload health data without it)
 * - account has a profile → use it on this phone
 * - otherwise → move this phone's answers into the account
 */
export async function completeSignIn(): Promise<AfterSignIn> {
  const me = await fetchMe();
  if (!me.consents.healthData.granted) return { next: 'consent' };

  if (me.profile) {
    applyServerProfile(me.profile);
    return { next: 'done', message: 'We loaded the preferences saved in your account.' };
  }

  const local = useProfile.getState();
  const input = local.onboardingComplete ? toProfileInput(local.profile, usePreferences.getState().showCalories) : null;
  if (!input) return { next: 'done', message: null };

  const result = await claimProfile(input);
  if (!result.applied) applyServerProfile(result.profile);
  return { next: 'done', message: result.applied ? 'Your answers are now saved to your account.' : null };
}
