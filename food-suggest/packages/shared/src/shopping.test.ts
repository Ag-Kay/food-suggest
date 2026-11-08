import { describe, expect, it } from 'vitest';

import { compareCategories, formatAmount, normaliseAmount } from './shopping';

describe('normaliseAmount', () => {
  it('converts known units to their base unit', () => {
    expect(normaliseAmount(1.5, 'kg')).toEqual({ kind: 'measured', family: 'mass', base: 1500 });
    expect(normaliseAmount(2, 'tbsp')).toEqual({ kind: 'measured', family: 'volume', base: 30 });
    expect(normaliseAmount(1, 'Cup')).toEqual({ kind: 'measured', family: 'volume', base: 240 });
    expect(normaliseAmount(3, 'piece')).toEqual({ kind: 'measured', family: 'count', base: 3 });
  });

  it('treats a pinch as unquantified', () => {
    expect(normaliseAmount(1, 'pinch')).toEqual({ kind: 'unquantified' });
  });

  it('keeps unknown units separate', () => {
    expect(normaliseAmount(2, 'bunch')).toEqual({ kind: 'other', unit: 'bunch', quantity: 2 });
  });
});

describe('formatAmount (always rounds up)', () => {
  it.each([
    ['mass', 437, '440 g'],
    ['mass', 12, '15 g'],
    ['mass', 1000, '1 kg'],
    ['mass', 1240, '1.3 kg'],
    ['volume', 5, '1 tsp'],
    ['volume', 7, '1.5 tsp'],
    ['volume', 20, '1.5 tbsp'],
    ['volume', 60, '4 tbsp'],
    ['volume', 120, '0.5 cup'],
    ['volume', 240, '1 cup'],
    ['volume', 300, '1.25 cups'],
    ['volume', 1200, '1.2 l'],
    ['count', 1.5, '2'],
    ['count', 2, '2'],
  ] as const)('%s %d → %s', (family, base, text) => {
    expect(formatAmount(family, base)).toBe(text);
  });

  it('never shows less than was summed', () => {
    for (let base = 1; base < 3000; base += 7) {
      const text = formatAmount('mass', base);
      const value = text.endsWith('kg') ? parseFloat(text) * 1000 : parseFloat(text);
      expect(value).toBeGreaterThanOrEqual(base);
    }
  });
});

describe('compareCategories', () => {
  it('orders known aisles first, unknown alphabetically after', () => {
    const sorted = ['Zebra', 'Oils', 'Vegetables', 'Apples'].sort(compareCategories);
    expect(sorted).toEqual(['Vegetables', 'Oils', 'Apples', 'Zebra']);
  });
});
