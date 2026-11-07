import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

/** Onboarding steps in order. Every step except age can be skipped. */
export const STEPS = ['age', 'goal', 'diet', 'allergies', 'foods', 'cooking'] as const;
export type StepName = (typeof STEPS)[number];

/**
 * Navigation for a step. In the first-run flow "Continue" moves to the next
 * step; when editing from Profile (`?edit=1`) it simply goes back.
 */
export function useStepFlow(current: StepName) {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const index = STEPS.indexOf(current);
  const next = STEPS[index + 1];

  return {
    /** Leave the onboarding flow and return to the tabs. */
    exit: () => router.dismissTo('/'),
    editing,
    step: index + 1,
    totalSteps: STEPS.length,
    goNext: () => {
      if (editing) router.back();
      else if (next) router.push(`/onboarding/${next}` as Href);
      else router.push('/onboarding/done');
    },
  };
}
