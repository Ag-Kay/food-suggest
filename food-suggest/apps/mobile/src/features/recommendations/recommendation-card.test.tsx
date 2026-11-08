import { render, screen } from '@testing-library/react-native';

import type { Recommendation } from '@food-suggest/shared';

import { RecommendationCard } from './recommendation-card';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const item: Recommendation = {
  score: 75,
  reasons: ['A good source of fibre (6 g per serving).', 'Fits your vegetarian diet.'],
  cautions: ['Leave out the shito: it contains fish.'],
  meal: {
    slug: 'waakye',
    name: 'Waakye',
    localNames: [],
    description: '',
    cuisine: { slug: 'ghanaian', name: 'Ghanaian' },
    slots: ['LUNCH'],
    imageUrl: null,
    totalMinutes: 90,
    difficulty: 'BEGINNER',
    diet: 'VEGETARIAN',
    allergens: ['EGG'],
    allergenInfoComplete: true,
    nutrition: null,
  },
};

describe('RecommendationCard', () => {
  it('shows the top reason and every caution, and reads all reasons to screen readers', async () => {
    await render(<RecommendationCard item={item} width={300} />);
    expect(screen.getByText('A good source of fibre (6 g per serving).')).toBeTruthy();
    expect(screen.getByText('Leave out the shito: it contains fish.')).toBeTruthy();
    expect(screen.getByLabelText(/Waakye\. 1 h 30 min\. Why: A good source of fibre.*Note: Leave out the shito/)).toBeTruthy();
  });
});
