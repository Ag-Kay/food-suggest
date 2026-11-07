import { describe, expect, it } from 'vitest';

import { canReceiveWeightLossTargets, MIN_AGE, ProfileInput } from './profile';

const year = new Date().getUTCFullYear();

describe('ProfileInput', () => {
  it('accepts a minimal profile with only the age gate', () => {
    const parsed = ProfileInput.parse({ birthYear: year - 30 });
    expect(parsed.allergens).toEqual([]);
    expect(parsed.showCalories).toBe(false);
  });

  it(`rejects anyone who could be younger than ${MIN_AGE}`, () => {
    // Born MIN_AGE years ago: might still be MIN_AGE - 1 until their birthday.
    expect(ProfileInput.safeParse({ birthYear: year - MIN_AGE }).success).toBe(false);
    expect(ProfileInput.safeParse({ birthYear: year - MIN_AGE - 1 }).success).toBe(true);
  });

  it('rejects unknown fields', () => {
    expect(ProfileInput.safeParse({ birthYear: year - 30, isAdmin: true }).success).toBe(false);
  });

  it('rejects unknown allergens', () => {
    expect(ProfileInput.safeParse({ birthYear: year - 30, allergens: ['NUTS'] }).success).toBe(false);
  });
});

describe('canReceiveWeightLossTargets', () => {
  it('is false for 16-17 year olds and true for adults', () => {
    expect(canReceiveWeightLossTargets(year - 18)).toBe(false); // may still be 17
    expect(canReceiveWeightLossTargets(year - 19)).toBe(true);
  });
});
