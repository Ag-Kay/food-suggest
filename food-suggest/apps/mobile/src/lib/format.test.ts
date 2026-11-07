import { formatIngredientAmount, formatMinutes, formatQuantity } from './format';

describe('formatQuantity', () => {
  it.each([
    [400, '400'],
    [0.5, '½'],
    [1.5, '1½'],
    [2.25, '2¼'],
    [0.75, '¾'],
    [0.2, '0.2'],
    [1, '1'],
  ])('%p → %p', (input, expected) => {
    expect(formatQuantity(input)).toBe(expected);
  });
});

describe('formatIngredientAmount', () => {
  it('keeps grams and pluralises pieces', () => {
    expect(formatIngredientAmount(400, 'g')).toBe('400 g');
    expect(formatIngredientAmount(4, 'piece')).toBe('4 pieces');
    expect(formatIngredientAmount(1, 'piece')).toBe('1 piece');
    expect(formatIngredientAmount(0.5, 'tsp')).toBe('½ tsp');
  });
});

describe('formatMinutes', () => {
  it('formats minutes and hours', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(95)).toBe('1 h 35 min');
  });
});
