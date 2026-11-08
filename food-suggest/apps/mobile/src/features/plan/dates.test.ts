import { addDays, dayLabel, fromDateKey, isDateKey, rangeLabel, startOfWeek, toDateKey, weekDays } from './dates';

describe('plan dates', () => {
  it('round-trips local calendar days', () => {
    expect(toDateKey(new Date(2026, 10, 8, 23, 59))).toBe('2026-11-08');
    expect(toDateKey(fromDateKey('2026-03-29'))).toBe('2026-03-29');
  });

  it('adds days across months, years and daylight-saving changes', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('starts weeks on Monday', () => {
    expect(startOfWeek('2026-11-08')).toBe('2026-11-02'); // Sunday → previous Monday
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09'); // Monday
    expect(weekDays('2026-11-09')).toEqual([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    ]);
  });

  it('labels days for people', () => {
    const today = '2026-11-08';
    expect(dayLabel('2026-11-08', today)).toBe('Today');
    expect(dayLabel('2026-11-09', today)).toBe('Tomorrow');
    expect(dayLabel('2026-11-07', today)).toBe('Yesterday');
    expect(dayLabel('2026-11-12', today)).toBe('Thu 12 Nov');
    expect(rangeLabel('2026-11-09', '2026-11-15')).toBe('9–15 Nov');
    expect(rangeLabel('2026-11-30', '2026-12-06')).toBe('30 Nov – 6 Dec');
  });

  it('validates keys', () => {
    expect(isDateKey('2026-11-08')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('8/11/2026')).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });
});
