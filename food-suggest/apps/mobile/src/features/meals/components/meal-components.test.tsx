import { fireEvent, render, screen } from '@testing-library/react-native';

import type { NutritionSummary } from '@food-suggest/shared';

import { usePreferences } from '@/stores/preferences';

import { AllergenNotice } from './allergen-notice';
import { macroLine } from './meal-card';
import { NutritionPanel } from './nutrition-panel';

const nutrition: NutritionSummary = {
  energyKcal: 460,
  proteinG: 20.3,
  carbsG: 77.4,
  fatG: 6.3,
  fibreG: 6.1,
  sugarsG: null,
  saturatedFatG: 1.7,
  sodiumMg: 483,
  method: 'CALCULATED_FROM_INGREDIENTS',
  reliability: 'ESTIMATED',
};

describe('NutritionPanel', () => {
  beforeEach(() => usePreferences.setState({ showCalories: false }));

  it('hides calories by default and shows them after opting in', async () => {
    await render(<NutritionPanel nutrition={nutrition} servings={4} />);
    expect(screen.queryByText('460 kcal')).toBeNull();
    expect(screen.getByText('20.3 g')).toBeTruthy();
    expect(screen.getByText(/Estimated from the ingredients/)).toBeTruthy();

    await fireEvent(screen.getByLabelText('Show calories'), 'valueChange', true);
    expect(screen.getByText('460 kcal')).toBeTruthy();
  });

  it('explains when nutrition is missing', async () => {
    await render(<NutritionPanel nutrition={null} servings={4} />);
    expect(screen.getByText(/isn't available/)).toBeTruthy();
  });
});

describe('AllergenNotice', () => {
  it('lists allergens, optional extras and warns when info is incomplete', async () => {
    await render(<AllergenNotice allergens={['EGG']} optionalAllergens={['FISH']} complete={false} />);
    expect(screen.getByText('Contains: Egg.')).toBeTruthy();
    expect(screen.getByText('Optional extras contain: Fish.')).toBeTruthy();
    expect(screen.getByText(/vary by brand/)).toBeTruthy();
  });

  it('says so when no major allergens are listed', async () => {
    await render(<AllergenNotice allergens={[]} optionalAllergens={[]} complete />);
    expect(screen.getByText(/No major allergens/)).toBeTruthy();
    expect(screen.queryByText(/vary by brand/)).toBeNull();
  });
});

describe('macroLine', () => {
  it('only includes calories when enabled', () => {
    expect(macroLine({ nutrition }, false)).toBe('20 g protein · 77 g carbs · 6 g fat');
    expect(macroLine({ nutrition }, true)).toMatch(/^460 kcal · /);
    expect(macroLine({ nutrition: null }, true)).toBeNull();
  });
});
