import { useRecentMeals } from './recent-meals';

describe('useRecentMeals', () => {
  beforeEach(() => useRecentMeals.getState().clear());

  it('keeps newest first without duplicates, capped at 10', () => {
    const { add } = useRecentMeals.getState();
    add({ slug: 'a', name: 'A', cuisine: 'X' });
    add({ slug: 'b', name: 'B', cuisine: 'X' });
    add({ slug: 'a', name: 'A', cuisine: 'X' });
    expect(useRecentMeals.getState().items.map((m) => m.slug)).toEqual(['a', 'b']);

    for (let i = 0; i < 15; i++) add({ slug: `m${i}`, name: 'M', cuisine: 'X' });
    expect(useRecentMeals.getState().items).toHaveLength(10);
  });
});
