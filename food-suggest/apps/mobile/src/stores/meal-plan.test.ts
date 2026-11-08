import { entriesBetween, KEEP_PAST_DAYS, useMealPlan } from './meal-plan';
import { MANUAL_CATEGORY, toShoppingItems, useShoppingLists } from './shopping-lists';

const plan = () => useMealPlan.getState();
const lists = () => useShoppingLists.getState();

beforeEach(() => {
  plan().clear();
  lists().clear();
});

describe('meal plan store', () => {
  it('adds, replaces, changes servings and removes entries', () => {
    const e = plan().add({ date: '2026-11-09', slot: 'LUNCH', slug: 'waakye', name: 'Waakye', servings: 2 });
    plan().replace(e.id, { slug: 'red-red', name: 'Red red' });
    plan().setServings(e.id, 40);
    expect(plan().entries).toEqual([expect.objectContaining({ slug: 'red-red', name: 'Red red', servings: 12, slot: 'LUNCH' })]);
    plan().setServings(e.id, 0);
    expect(plan().entries[0]!.servings).toBe(1);
    plan().remove(e.id);
    expect(plan().entries).toEqual([]);
  });

  it('drops days older than the retention window', () => {
    plan().add({ date: '2026-10-01', slot: 'DINNER', slug: 'a', name: 'A', servings: 1 });
    plan().add({ date: '2026-11-01', slot: 'DINNER', slug: 'b', name: 'B', servings: 1 });
    plan().prune('2026-11-08');
    expect(plan().entries.map((e) => e.slug)).toEqual(['b']);
    expect(KEEP_PAST_DAYS).toBeGreaterThanOrEqual(7);
  });

  it('sorts a range by day, then breakfast → snack', () => {
    plan().add({ date: '2026-11-10', slot: 'BREAKFAST', slug: 'c', name: 'C', servings: 1 });
    plan().add({ date: '2026-11-09', slot: 'SNACK', slug: 'b', name: 'B', servings: 1 });
    plan().add({ date: '2026-11-09', slot: 'BREAKFAST', slug: 'a', name: 'A', servings: 1 });
    plan().add({ date: '2026-11-20', slot: 'LUNCH', slug: 'z', name: 'Z', servings: 1 });
    expect(entriesBetween(plan().entries, '2026-11-09', '2026-11-15').map((e) => e.slug)).toEqual(['a', 'b', 'c']);
  });
});

describe('shopping lists store', () => {
  const generated = (key: string, name: string) => ({
    key,
    ingredientSlug: key,
    name,
    category: 'Vegetables',
    quantity: 100,
    unit: 'g',
    amountText: '100 g',
    optional: false,
    meals: ['Waakye'],
  });

  it('creates lists and edits items', () => {
    const list = lists().create({ name: '  Week  of   9 Nov ', items: toShoppingItems([generated('onion:mass', 'Onion')]) });
    expect(lists().lists[0]!.name).toBe('Week of 9 Nov');
    lists().addItem(list.id, { name: 'Toilet roll', amountText: '1 pack' });
    lists().addItem(list.id, { name: '   ' });
    const items = lists().lists[0]!.items;
    expect(items).toHaveLength(2);
    expect(items[1]).toMatchObject({ name: 'Toilet roll', category: MANUAL_CATEGORY, source: 'MANUAL' });

    lists().toggleItem(list.id, items[0]!.id);
    lists().updateItem(list.id, items[1]!.id, { name: 'Soap', amountText: '' });
    expect(lists().lists[0]!.items.map((i) => [i.name, i.checked])).toEqual([['Onion', true], ['Soap', false]]);

    lists().clearChecked(list.id);
    expect(lists().lists[0]!.items.map((i) => i.name)).toEqual(['Soap']);
    lists().remove(list.id);
    expect(lists().lists).toEqual([]);
  });

  it('regenerating keeps manual items and ticks for lines still needed', () => {
    const list = lists().create({
      name: 'Plan',
      items: toShoppingItems([generated('onion:mass', 'Onion'), generated('rice:mass', 'Rice')]),
    });
    const [onion] = lists().lists[0]!.items;
    lists().toggleItem(list.id, onion!.id);
    lists().addItem(list.id, { name: 'Soap' });

    lists().replaceGenerated(list.id, toShoppingItems([generated('onion:mass', 'Onion'), generated('yam:mass', 'Yam')]));
    const after = lists().lists[0]!.items.map((i) => [i.name, i.checked]);
    expect(after).toEqual([['Onion', true], ['Yam', false], ['Soap', false]]);
  });
});
