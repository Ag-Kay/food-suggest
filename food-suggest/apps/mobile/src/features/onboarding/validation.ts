import { MIN_AGE, minimumAgeFromBirthYear } from '@food-suggest/shared';

/** Validates a typed birth year and applies the conservative 16+ age gate. */
export function validateBirthYear(text: string, now = new Date()): { year?: number; error?: string; tooYoung?: boolean } {
  if (!/^\d{4}$/.test(text)) return { error: 'Enter a four-digit year, for example 1995.' };
  const year = Number(text);
  if (year < 1900 || year > now.getUTCFullYear()) return { error: 'Please check the year.' };
  if (minimumAgeFromBirthYear(year, now) < MIN_AGE) return { tooYoung: true };
  return { year };
}
