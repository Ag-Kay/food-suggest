import type { MeResponse } from '@food-suggest/shared';

import { usePreferences } from '@/stores/preferences';
import { useProfile } from '@/stores/profile';

import { completeSignIn } from './after-sign-in';
import { claimProfile, fetchMe } from './api';

jest.mock('./api', () => ({ fetchMe: jest.fn(), claimProfile: jest.fn() }));

const me = (over: Partial<MeResponse>): MeResponse => ({
  user: { id: 'u', email: 'a@b.co' },
  profile: null,
  consents: { healthData: { granted: true, version: 'v' } },
  ...over,
});

const serverProfile = {
  birthYear: 1980,
  goal: 'EAT_HEALTHIER' as const,
  allergens: [],
  avoidIngredients: [],
  likedIngredients: [],
  dislikedIngredients: [],
  cuisines: [],
  preferredSlots: [],
  showCalories: true,
};

describe('completeSignIn', () => {
  beforeEach(() => {
    jest.mocked(claimProfile).mockReset();
    useProfile.getState().reset();
    usePreferences.setState({ showCalories: false });
  });

  it('asks for consent before uploading anything', async () => {
    jest.mocked(fetchMe).mockResolvedValue(me({ consents: { healthData: { granted: false, version: null } } }));
    useProfile.setState({ profile: { birthYear: 1990 }, onboardingComplete: true });
    await expect(completeSignIn()).resolves.toEqual({ next: 'consent' });
    expect(claimProfile).not.toHaveBeenCalled();
  });

  it("uses the account's profile when one exists", async () => {
    jest.mocked(fetchMe).mockResolvedValue(me({ profile: serverProfile }));
    const r = await completeSignIn();
    expect(r).toMatchObject({ next: 'done' });
    expect(useProfile.getState()).toMatchObject({ profile: { birthYear: 1980, goal: 'EAT_HEALTHIER' }, onboardingComplete: true });
    expect(usePreferences.getState().showCalories).toBe(true);
    expect(claimProfile).not.toHaveBeenCalled();
  });

  it("moves this phone's answers into a new account", async () => {
    jest.mocked(fetchMe).mockResolvedValue(me({}));
    jest.mocked(claimProfile).mockResolvedValue({ applied: true, profile: serverProfile });
    useProfile.setState({ profile: { birthYear: 1990, goal: 'BUILD_MUSCLE' }, onboardingComplete: true });
    const r = await completeSignIn();
    expect(claimProfile).toHaveBeenCalledWith(expect.objectContaining({ birthYear: 1990, goal: 'BUILD_MUSCLE' }));
    expect(r).toEqual({ next: 'done', message: 'Your answers are now saved to your account.' });
  });

  it('does nothing extra when there is nothing to claim', async () => {
    jest.mocked(fetchMe).mockResolvedValue(me({}));
    await expect(completeSignIn()).resolves.toEqual({ next: 'done', message: null });
    expect(claimProfile).not.toHaveBeenCalled();
  });
});
