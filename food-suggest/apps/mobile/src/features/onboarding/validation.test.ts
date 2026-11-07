import { validateBirthYear } from './validation';

const NOW = new Date('2026-11-07T12:00:00Z');

describe('validateBirthYear', () => {
  it('accepts adults', () => {
    expect(validateBirthYear('1995', NOW)).toEqual({ year: 1995 });
  });

  it('blocks anyone who could be under 16', () => {
    expect(validateBirthYear('2010', NOW).tooYoung).toBe(true); // could still be 15
    expect(validateBirthYear('2009', NOW)).toEqual({ year: 2009 });
  });

  it('rejects malformed or impossible years', () => {
    expect(validateBirthYear('95', NOW).error).toBeDefined();
    expect(validateBirthYear('1800', NOW).error).toBeDefined();
    expect(validateBirthYear('2030', NOW).error).toBeDefined();
  });
});
