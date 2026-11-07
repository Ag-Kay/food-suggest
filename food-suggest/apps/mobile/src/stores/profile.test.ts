import { toProfileInput, useProfile } from './profile';

describe('profile store', () => {
  beforeEach(() => useProfile.getState().reset());

  it('builds an API profile only after the age gate', () => {
    expect(toProfileInput({}, false)).toBeNull();
    const p = toProfileInput({ birthYear: 1990, allergens: ['EGG'] }, true);
    expect(p).toMatchObject({ birthYear: 1990, allergens: ['EGG'], avoidIngredients: [], showCalories: true });
  });

  it('merges updates and clears everything on reset', () => {
    const s = useProfile.getState();
    s.update({ birthYear: 1990 });
    s.update({ goal: 'BUILD_MUSCLE' });
    s.completeOnboarding();
    expect(useProfile.getState()).toMatchObject({ profile: { birthYear: 1990, goal: 'BUILD_MUSCLE' }, onboardingComplete: true });
    useProfile.getState().reset();
    expect(useProfile.getState()).toMatchObject({ profile: {}, onboardingComplete: false });
  });
});
